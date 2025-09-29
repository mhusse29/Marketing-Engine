import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load server-specific .env file to override root .env
config({ path: resolve(process.cwd(), 'server/.env') })

function stripCodeFences(s = "") {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  return m ? m[1] : s
}
function cropToJsonObject(s = "") {
  const i = s.indexOf("{")
  const j = s.lastIndexOf("}")
  return i >= 0 && j > i ? s.slice(i, j + 1) : s
}
function tryParseJSON(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}
function safeParseOrRepair(s = "") {
  if (!s) return null
  let out = tryParseJSON(s)
  if (out) return out
  out = tryParseJSON(stripCodeFences(s))
  if (out) return out
  out = tryParseJSON(cropToJsonObject(s))
  if (out) return out
  const fixed = cropToJsonObject(stripCodeFences(s))
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]")
  out = tryParseJSON(fixed)
  return out
}

const ALLOWED = ["Facebook","Instagram","TikTok","LinkedIn","X","YouTube"];

const PLATFORM_CANON = new Map([
  ['facebook','Facebook'], ['fb','Facebook'],
  ['instagram','Instagram'], ['ig','Instagram'],
  ['tiktok','TikTok'], ['tik tok','TikTok'],
  ['linkedin','LinkedIn'], ['li','LinkedIn'],
  ['x','X'], ['twitter','X'], ['x (twitter)','X'], ['twitter/x','X'],
  ['youtube','YouTube'], ['yt','YouTube']
]);

function canonOne(p) {
  if (!p) return null;
  const m = PLATFORM_CANON.get(String(p).trim().toLowerCase());
  return ALLOWED.includes(m) ? m : null;
}

function canonicalizePlatformField(v) {
  if (!v) return null
  const raw = String(v).trim()

  const split = raw
    .split(/[\/,&]| and /i)
    .map((s) => s.trim())
    .filter(Boolean)

  if (split.length > 1) {
    const arr = []
    for (const part of split) {
      const key = part.toLowerCase()
      const mapped = PLATFORM_CANON.get(key)
      if (mapped && !arr.includes(mapped)) arr.push(mapped)
    }
    return arr.length ? arr : null
  }

  const key = raw.toLowerCase()
  return PLATFORM_CANON.get(key) || null
}

function asString(v, def = '') {
  return (v ?? def) + ''
}

function asArrayStrings(arr, max = 10) {
  if (!Array.isArray(arr)) return []
  return arr
    .slice(0, max)
    .map((x) => (x ?? '').toString())
    .filter(Boolean)
}

function chunkList(list, size) {
  if (!Array.isArray(list) || size <= 0) return [list || []]
  const out = []
  for (let i = 0; i < list.length; i += size) {
    out.push(list.slice(i, i + size))
  }
  return out.length ? out : [[]]
}

function normalizeVariants(parsed, selected, versions) {
  const sel = Array.from(new Set(selected))
  const byPlat = new Map(sel.map((p) => [p, []]))

  const deferred = []

  for (const v of parsed?.variants || []) {
    const mapped = canonicalizePlatformField(v?.platform)
    const targets = Array.isArray(mapped) ? mapped : mapped ? [mapped] : []
    for (const p of targets) {
      if (!sel.includes(p)) continue
      byPlat.get(p).push({
        platform: p,
        headline: asString(v?.headline),
        primary_text: asString(v?.primary_text),
        cta_label: asString(v?.cta_label || 'Learn more'),
        hashtags: asArrayStrings(v?.hashtags, 10),
        alt_text: asString(v?.alt_text || ''),
      })
    }

    if (!targets.length) {
      deferred.push(v)
    }
  }

  if (deferred.length && sel.length) {
    const order = sel.map((platform) => ({ platform, items: byPlat.get(platform) || [] }))
    for (const raw of deferred) {
      order.sort((a, b) => a.items.length - b.items.length)
      const target = order[0]
      if (!target) break
      const normalized = {
        platform: target.platform,
        headline: asString(raw?.headline),
        primary_text: asString(raw?.primary_text),
        cta_label: asString(raw?.cta_label || 'Learn more'),
        hashtags: asArrayStrings(raw?.hashtags, 10),
        alt_text: asString(raw?.alt_text || ''),
      }
      target.items.push(normalized)
    }
  }

  let salvaged = false
  const out = []

  for (const p of sel) {
    const arr = byPlat.get(p) || []
    if (arr.length >= versions) {
      out.push(...arr.slice(0, versions))
    } else if (arr.length > 0) {
      salvaged = true
      while (arr.length < versions) arr.push({ ...arr[0] })
      out.push(...arr.slice(0, versions))
    }
  }

  const missing = sel.filter((p) => !out.some((v) => v.platform === p))
  const meta = {
    ...(parsed?.meta || {}),
    missing,
    salvaged: salvaged || missing.length > 0,
  }

  return { variants: out, meta, salvaged: meta.salvaged }
}

async function backfillMissing({ missing, versions, usedModel, system, brief, options, openai }) {
  const results = []
  for (const p of missing) {
    const prompt = [
      `BRIEF:\n${brief}`,
      `Generate EXACTLY ${versions} variants for platform: ${p}`,
      'Output JSON only with this schema (no extra text):',
      JSON.stringify(
        {
          variants: [
            {
              platform: p,
              headline: 'string',
              primary_text: 'string',
              cta_label: 'string',
              hashtags: ['string'],
              alt_text: 'string',
            },
          ],
        },
        null,
        2
      ),
    ].join('\n\n')

    try {
      const r = await openai.chat.completions.create({
        model: usedModel,
        temperature: options?.copyLength === 'Detailed' ? 0.6 : 0.7,
        top_p: 1,
        max_tokens: options?.copyLength === 'Detailed' ? 650 : 320,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      })
      const raw = r.choices?.[0]?.message?.content || ''
      let parsed = safeParseOrRepair(raw)
      if (parsed?.variants?.length) {
        for (const v of parsed.variants) {
          v.platform = p
        }
        results.push(...parsed.variants.slice(0, versions))
      } else {
        console.warn('[backfill] empty for', p, 'raw>>>', raw)
      }
    } catch (error) {
      console.warn('[backfill] provider error for', p, error?.message || error)
    }
  }
  return results
}


async function generateBatch({
  runId,
  batchIndex,
  batch,
  system,
  user,
  versions,
  maxTokens,
  baseTemperature,
  preferredModel,
}) {
  let model = preferredModel || OPENAI_PRIMARY_MODEL
  let triedPlain = false

  const callModel = async (modelId, forcePlain) => {
    const temperature = baseTemperature

    if (USE_RESPONSES) {
      const payload = {
        model: modelId,
        temperature,
        top_p: 1,
        max_output_tokens: maxTokens,
        input: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }
      if (!forcePlain) {
        payload.response_format = {
          type: 'json_schema',
          json_schema: { name: 'marketing_engine_variants', schema: resultSchema, strict: true },
        }
      }
      const r = await openai.responses.create(payload)
      const finish = (r.output?.[r.output.length - 1]?.finish_reason) || r.finish_reason || 'stop'
      const raw = r.output_text || (r.output?.[0]?.content?.[0]?.text ?? '')
      return { raw, finish, usage: r.usage }
    }

    const payload = {
      model: modelId,
      temperature,
      top_p: 1,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }
    if (!forcePlain) {
      payload.response_format = { type: 'json_object' }
    }
    const r = await openai.chat.completions.create(payload)
    const finish = r.choices?.[0]?.finish_reason || 'stop'
    const raw = r.choices?.[0]?.message?.content || ''
    return { raw, finish, usage: r.usage }
  }

  const runWithModel = async (modelId) => {
    const first = await callModel(modelId, false)
    let parsed = safeParseOrRepair(first.raw)
    let finish = first.finish

    if (!parsed || finish === 'length') {
      console.warn(`[RUN ${runId}] batch ${batchIndex} model ${modelId} ${parsed ? 'finish_length' : 'parse_fail'}; retry plain`)
      const second = await callModel(modelId, true)
      triedPlain = true
      if (second.raw) {
        const cand = safeParseOrRepair(second.raw)
        if (cand) parsed = cand
      }
      finish = second.finish || finish
    }

    return { parsed, finish }
  }

  let parsed = null
  try {
    const { parsed: firstParsed } = await runWithModel(model)
    parsed = firstParsed
  } catch (error) {
    console.error(`[RUN ${runId}] batch ${batchIndex} primary model ${model} failed`, error)
  }

  if (!parsed && model !== OPENAI_FALLBACK_MODEL) {
    try {
      model = OPENAI_FALLBACK_MODEL
      const { parsed: fallbackParsed } = await runWithModel(model)
      parsed = fallbackParsed
    } catch (error) {
      console.error(`[RUN ${runId}] batch ${batchIndex} fallback model ${OPENAI_FALLBACK_MODEL} failed`, error)
    }
  }

  const normalized = parsed
    ? normalizeVariants(parsed, batch, versions)
    : normalizeVariants({ variants: [] }, batch, versions)

  return { normalized, model, triedPlain }
}

console.log('cwd:', process.cwd())

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const MOCK_OPENAI = process.env.MOCK_OPENAI === '1'
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

const PRIMARY = 'openai'
// Force OpenAI models to avoid Anthropic model conflicts
const OPENAI_PRIMARY_MODEL = 'gpt-4o-mini'
const OPENAI_FALLBACK_MODEL = 'gpt-4o'
const promptVersion = 'content-v1.3'
const MAX_TOKENS_STANDARD = Number(process.env.MAX_TOKENS_STANDARD || 420)
const MAX_TOKENS_LONGFORM = Number(process.env.MAX_TOKENS_LONGFORM || 850)
const MAX_PLATFORMS_PER_CALL = Math.max(1, Number(process.env.MAX_PLATFORMS_PER_CALL || 3))

const RUNS = new Map()
const SUBSCRIBERS = new Map()
const USE_RESPONSES = process.env.USE_RESPONSES === '1'

function publishRun(runId, state) {
  const listeners = SUBSCRIBERS.get(runId)
  if (!listeners) return
  for (const listener of listeners) {
    try {
      listener(state)
    } catch (error) {
      console.error('[ai-gateway] subscriber error', error)
    }
  }
}

function subscribeRun(runId, listener) {
  const set = SUBSCRIBERS.get(runId) || new Set()
  set.add(listener)
  SUBSCRIBERS.set(runId, set)
  return () => {
    set.delete(listener)
    if (set.size === 0) {
      SUBSCRIBERS.delete(runId)
    }
  }
}

const runs = RUNS
const bus = {
  subscribe: subscribeRun,
  publish: publishRun,
}
const id = () => Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)

const IMAGE_ASPECT_SPECS = {
  '1:1': { size: '1024x1024', width: 1024, height: 1024 },
  '4:5': { size: '1024x1536', width: 1024, height: 1536 },
  '16:9': { size: '1536x1024', width: 1536, height: 1024 },
}

const IMAGE_FALLBACK_URLS = [
  'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1454165205744-3b78555e5572?auto=format&fit=crop&w=1200&q=80',
]

function mockImageAssets({ prompt, aspect, count }) {
  const dims = IMAGE_ASPECT_SPECS[aspect] || IMAGE_ASPECT_SPECS['1:1']
  return Array.from({ length: count }).map((_, idx) => {
    const url = IMAGE_FALLBACK_URLS[(idx + Math.floor(Math.random() * 5)) % IMAGE_FALLBACK_URLS.length]
    return {
      id: id(),
      url,
      thumbUrl: `${url}&w=480`,
      width: dims.width,
      height: dims.height,
      mimeType: 'image/jpeg',
      prompt: `${prompt} (variation ${idx + 1})`,
      seed: `${Date.now()}-${idx}`,
    }
  })
}

function assetFromOpenAI(item, dims, prompt) {
  const url = item?.url || (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null)
  if (!url) return null
  return {
    id: id(),
    url,
    thumbUrl: item?.url || undefined,
    width: dims.width,
    height: dims.height,
    mimeType: 'image/png',
    prompt: item?.revised_prompt || prompt,
    seed: item?.seed ? String(item.seed) : undefined,
  }
}

const platformGuides = {
  Facebook: 'Facebook feed: conversational 1–2 sentences; optional emoji; 3–6 hashtags.',
  Instagram: 'Instagram: visual tone; 1–2 sentences; 3–6 hashtags; emojis ok.',
  TikTok: 'TikTok caption: 1 hook + 1 benefit; casual; 3–5 hashtags; <150 chars.',
  LinkedIn: 'LinkedIn: professional, value-first; longer paragraph copy encouraged.',
  X: 'X/Twitter: <=240 chars; 1 hook + 1 benefit; 0–2 hashtags.',
  YouTube: 'YouTube short description: hook + value; include 2–4 hashtags.',
}

const LENGTH_BUDGETS = {
  Compact: {
    Facebook: [60, 140],
    Instagram: [60, 140],
    TikTok: [60, 150],
    X: [80, 240],
    LinkedIn: [90, 180],
    YouTube: [80, 160],
  },
  Standard: {
    Facebook: [120, 220],
    Instagram: [120, 220],
    TikTok: [90, 150],
    X: [120, 240],
    LinkedIn: [160, 260],
    YouTube: [140, 260],
  },
  Detailed: {
    Facebook: [180, 320],
    Instagram: [180, 320],
    TikTok: [120, 150],
    X: [180, 240],
    LinkedIn: [240, 420],
    YouTube: [240, 480],
  },
}

const PLATFORM_ENUM = ['Facebook', 'Instagram', 'TikTok', 'LinkedIn', 'X', 'YouTube']

const variantSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['platform', 'headline', 'primary_text', 'cta_label', 'hashtags'],
  properties: {
    platform: { type: 'string', enum: PLATFORM_ENUM },
    headline: { type: 'string' },
    primary_text: { type: 'string' },
    cta_label: { type: 'string' },
    hashtags: { type: 'array', items: { type: 'string' }, default: [] },
    alt_text: { type: 'string', default: '' },
  },
}

const resultSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['variants'],
  properties: {
    variants: { type: 'array', items: variantSchema, minItems: 1 },
    meta: {
      type: 'object',
      additionalProperties: true,
      properties: {
        model: { type: 'string' },
        promptVersion: { type: 'string' },
        language: { type: 'string' },
        persona: { type: 'string' },
      },
    },
  },
}

function budgetFor(platform, profile = 'Standard') {
  const map = LENGTH_BUDGETS[profile] || LENGTH_BUDGETS.Standard
  return map[platform] || [140, 260]
}

function shortenText(text = '', max = 240) {
  if (!text) return text
  if (!Number.isFinite(max) || max <= 0) return ''
  if (text.length <= max) return text
  const slice = text.slice(0, Math.max(0, max - 1))
  const clipped = slice.replace(/\s+\S*$/, '')
  const base = clipped.trim().length ? clipped.trimEnd() : slice.trimEnd()
  return `${base}…`
}

const PLATFORM_SYNONYMS = new Map([
  [/twitter|^x$/i, 'X'],
  [/linkedin/i, 'LinkedIn'],
  [/instagram/i, 'Instagram'],
  [/facebook/i, 'Facebook'],
  [/tiktok/i, 'TikTok'],
  [/youtube/i, 'YouTube'],
])

function buildSystem(options) {
  const tone = (options.tones || []).join(', ')
  return [
    'You are a senior marketing copywriter.',
    `Write ${options.language} short-form copy that converts.`,
    `Persona: ${options.persona}. Tone: ${tone || 'Professional'}.`,
    'Respect given CTA labels exactly.',
    'If language is AR, respond in Modern Standard Arabic.',
    `Avoid: ${(options.avoid && options.avoid.join(', ')) || '—'}.`,
    `Keywords to include: ${(options.keywords && options.keywords.join(', ')) || '—'}.`,
    'Return STRICT JSON only. No commentary.',
  ].join('\n')
}

function normalizePlatformName(name) {
  if (!name) return 'Generic'
  for (const [re, key] of PLATFORM_SYNONYMS) {
    if (re.test(String(name))) return key
  }
  return String(name)
}

function enforcePerPlatform(resp, selected, versions) {
  const allow = new Set(selected)
  const buckets = Object.fromEntries(selected.map((p) => [p, []]))

  for (const variant of resp.variants || []) {
    const platform = normalizePlatformName(variant.platform)
    if (allow.has(platform)) {
      buckets[platform].push({ ...variant, platform })
    }
  }

  const out = []
  for (const platform of selected) {
    const list = buckets[platform]
    if (list.length >= versions) {
      out.push(...list.slice(0, versions))
      continue
    }

    out.push(...list)
    const seed =
      list[list.length - 1] || {
        platform,
        headline: 'Placeholder headline',
        primary_text: 'Placeholder body copy',
        cta_label: 'Learn more',
        hashtags: [],
      }

    while (list.length < versions) {
      const clone = {
        ...seed,
        headline: `${seed.headline} (Alt ${list.length + 1})`,
      }
      list.push(clone)
      out.push(clone)
    }
  }

  resp.variants = out
  return resp
}

const ALLOWED_PLATFORMS = new Set(PLATFORM_ENUM)

function resolvePlatforms(options) {
  const requested = options?.platforms || ['Facebook', 'Instagram', 'LinkedIn']
  const selected = requested.filter((p) => ALLOWED_PLATFORMS.has(p))
  return selected.length ? selected : ['LinkedIn']
}

function buildUser(req) {
  const { brief, versions = 2 } = req
  const platformList = resolvePlatforms(req.options)
  const profile = req.options.copyLength || 'Standard'
  const budgetLines = platformList
    .map((platform) => {
      const [min, max] = budgetFor(platform, profile)
      return `- ${platform}: Target ${min}–${max} characters for primary_text.`
    })
    .join('\n')

  const paragraphHint = [
    'PARAGRAPH STYLE:',
    '- If Copy length is "Detailed" OR platform is LinkedIn/YouTube, write 3–5 sentences as one cohesive paragraph.',
    '- Otherwise keep primary_text to 1–2 sentences with a strong hook.',
  ].join('\n')

  const ctas = (req.options.ctas && req.options.ctas.length)
    ? req.options.ctas.join(' | ')
    : 'Learn more'

  const schema = {
    variants: [
      {
        platform: platformList[0] || 'LinkedIn',
        headline: 'string',
        primary_text: 'string',
        cta_label: 'string',
        hashtags: ['string'],
        alt_text: 'string',
      },
    ],
    meta: {
      model: 'string',
      promptVersion,
      language: req.options.language,
      persona: req.options.persona,
      tones: req.options.tones || [],
    },
  }

  const regenNote = req.regen
    ? `REGENERATION REQUEST:
- Produce NEW angles, not paraphrases.
- Variation target: ${req.regenHint || 'different hook/benefit focus'}.
- Diversity seed: ${req.nonce || Date.now()}.`
    : ''

  const platformLines = platformList
    .map((platform) => {
      const guide = platformGuides[platform]
      return guide ? `- ${platform}: ${guide}` : `- ${platform}`
    })
    .join('\n')

  const sections = [
    `BRIEF:
${brief}`,
    `PLATFORMS (write for each):
${platformLines}`,
    paragraphHint,
    `CTA choices (pick best per variant): ${ctas}`,
    `LENGTH GUIDANCE (Copy length: ${profile}):
${budgetLines}

If platform norms cap length (e.g., TikTok/X), stay within the cap.`,
    `OUTPUT RULES:
- Generate EXACTLY ${versions} variants per platform in the list above.
- Total variants = platforms.length × ${versions}.
- Each variant MUST include a "platform" field whose value is one of: ${platformList
      .map((p) => `"${p}"`)
      .join(', ')}.
- JSON schema (single flat array, not grouped):
${JSON.stringify(schema, null, 2)}`,
  ]

  if (regenNote) sections.push(regenNote)

  return sections.join('\n\n')
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    events: ['/events', '/ai/events'],
    providerPrimary: PRIMARY,
    primaryModel: OPENAI_PRIMARY_MODEL,
    fallbackModel: OPENAI_FALLBACK_MODEL,
    hasAnthropic: false,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
  })
})

app.post('/v1/images/generate', async (req, res) => {
  const prompt = req.body?.prompt
  const aspect = req.body?.aspect || '1:1'
  const countInput = Number(req.body?.count ?? 1)
  const count = Math.max(1, Math.min(Number.isFinite(countInput) ? Math.floor(countInput) : 1, 1))
  const dims = IMAGE_ASPECT_SPECS[aspect] || IMAGE_ASPECT_SPECS['1:1']

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'missing_prompt' })
  }

  if (MOCK_OPENAI) {
    return res.json({ assets: mockImageAssets({ prompt, aspect, count }) })
  }

  if (!openai) {
    return res.status(503).json({ error: 'openai_not_configured' })
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: count,
      size: dims.size,
    })

    const assets = (response?.data || [])
      .map((item) => assetFromOpenAI(item, dims, prompt))
      .filter(Boolean)

    if (!assets.length) {
      return res.status(502).json({ error: 'openai_image_empty' })
    }

    res.json({ assets })
  } catch (error) {
    console.error('[images] openai generation failed', error)
    res.status(502).json({
      error: 'openai_image_error',
      message: error?.message || 'unknown_error',
    })
  }
})

app.post('/v1/generate', async (req, res) => {
  if (!req.body?.brief || !req.body?.options) {
    return res.status(400).json({ error: 'missing brief/options' })
  }
  const runId = id()
  update(runId, 'queued', null, null)
  res.json({ runId })
  setTimeout(() => processRun(runId, req.body).catch(() => {}), 20)
})

function sseWrite(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`)
}

function sseKeepAlive(res) {
  return setInterval(() => sseWrite(res, { type: 'ping' }), 15000)
}

function eventsHandler(req, res) {
  console.log('[SSE] connect', req.originalUrl)

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'X-Accel-Buffering': 'no',
  })

  const runId = String(req.query.runId || '')
  const keep = sseKeepAlive(res)

  const snap = runs.get(runId)
  if (snap) {
    sseWrite(res, {
      id: runId,
      status: snap.status,
      payload: snap.data ?? null,
      error: snap.error ?? null,
    })
  }

  const unsub = bus.subscribe(runId, (state) => {
    sseWrite(res, {
      id: runId,
      status: state.status,
      payload: state.data ?? null,
      error: state.error ?? null,
    })
  })

  req.on('close', () => {
    clearInterval(keep)
    unsub()
    res.end()
  })
}

app.get('/events', eventsHandler)
app.get('/ai/events', eventsHandler)

async function processRun(runId, data) {
  update(runId, 'thinking')

  if (!openai && !MOCK_OPENAI) {
    update(runId, 'error', null, 'openai_not_configured')
    return
  }

  try {
    const baseOptions = data.options || {}
    const system = buildSystem(baseOptions)
    const rawPlatforms = [
      ...(Array.isArray(data.platforms) ? data.platforms : []),
      ...(Array.isArray(baseOptions.platforms) ? baseOptions.platforms : []),
      ...(Array.isArray(data?.settings?.platforms) ? data.settings.platforms : []),
    ].filter(Boolean)
    let selected = Array.from(new Set(rawPlatforms.map(canonOne).filter(Boolean)))
    if (!selected.length) selected = resolvePlatforms(baseOptions)
    const versionsInput = Number(data.versions ?? baseOptions.versions ?? 1)
    const versions = Math.min(Math.max(1, Number.isFinite(versionsInput) ? Math.floor(versionsInput) : 1), 4)
    const longForm = baseOptions.copyLength === 'Detailed' || selected.some((p) => p === 'LinkedIn' || p === 'YouTube')
    const maxTokens = longForm ? MAX_TOKENS_LONGFORM : MAX_TOKENS_STANDARD
    const baseTemperature = data.regen ? 0.85 : (longForm ? 0.6 : 0.7)
    const batches = chunkList(selected, MAX_PLATFORMS_PER_CALL)

    if (MOCK_OPENAI) {
      const mockVariants = []
      for (const platform of selected) {
        for (let i = 0; i < versions; i += 1) {
          mockVariants.push({
            platform,
            headline: `${platform} headline example v${i + 1}`,
            primary_text: `Sample primary text for ${platform} generated at ${new Date().toISOString()}.`,
            cta_label: 'Learn more',
            hashtags: ['marketing', 'growth'],
            alt_text: '',
          })
        }
      }

      update(runId, 'rendering')
      update(runId, 'ready', {
        variants: mockVariants,
        meta: {
          model: 'mock-openai',
          promptVersion,
          platforms: selected,
          versions,
          salvaged: false,
          triedPlain: false,
          mock: true,
          runId,
        },
      })
      return
    }

    console.log(`[RUN ${runId}] batch plan`, { selected, versions, batchCount: batches.length, perBatch: batches })

    const aggregator = new Map(selected.map((p) => [p, []]))
    const modelsUsed = new Set()
    let triedPlainAny = false
    let salvagedAny = false
    let backfilledAny = false
    let renderingSent = false

    for (let i = 0; i < batches.length; i += 1) {
      const batch = batches[i]
      const batchOptions = { ...baseOptions, platforms: batch }
      const batchPayload = { ...data, options: batchOptions, versions }
      const user = buildUser(batchPayload)
      const result = await generateBatch({
        runId,
        batchIndex: i,
        batch,
        system,
        user,
        versions,
        maxTokens,
        baseTemperature,
        preferredModel: data.modelPref || OPENAI_PRIMARY_MODEL,
      })

      if (!renderingSent) {
        update(runId, 'rendering')
        renderingSent = true
      }

      triedPlainAny = triedPlainAny || result.triedPlain
      salvagedAny = salvagedAny || result.normalized.salvaged
      modelsUsed.add(result.model)

      for (const variant of result.normalized.variants) {
        const bucket = aggregator.get(variant.platform)
        if (bucket) bucket.push(variant)
      }
    }

    if (!renderingSent) {
      update(runId, 'rendering')
      renderingSent = true
    }

    let missing = selected.filter((platform) => (aggregator.get(platform) || []).length < versions)

    if (missing.length && openai && !MOCK_OPENAI) {
      const backfillResults = await backfillMissing({
        missing,
        versions,
        usedModel: Array.from(modelsUsed)[0] || OPENAI_PRIMARY_MODEL,
        system,
        brief: data.brief,
        options: baseOptions,
        openai,
      })

      if (backfillResults.length) {
        salvagedAny = true
        backfilledAny = true
        for (const variant of backfillResults) {
          const bucket = aggregator.get(variant.platform)
          if (bucket) {
            bucket.push({
              platform: variant.platform,
              headline: asString(variant.headline),
              primary_text: asString(variant.primary_text),
              cta_label: asString(variant.cta_label || 'Learn more'),
              hashtags: asArrayStrings(variant.hashtags, 10),
              alt_text: asString(variant.alt_text || ''),
            })
          }
        }
      }

      missing = selected.filter((platform) => (aggregator.get(platform) || []).length < versions)
    }

    const finalVariants = []

    for (const platform of selected) {
      const bucket = aggregator.get(platform) || []
      if (bucket.length >= versions) {
        finalVariants.push(...bucket.slice(0, versions))
        continue
      }

      if (bucket.length > 0) {
        salvagedAny = true
        while (bucket.length < versions) bucket.push({ ...bucket[0] })
        finalVariants.push(...bucket.slice(0, versions))
        continue
      }

      salvagedAny = true
      const stub = {
        platform,
        headline: 'Draft headline',
        primary_text: 'Draft copy — press Regenerate for a fresh variant.',
        cta_label: 'Learn more',
        hashtags: [],
        alt_text: '',
      }
      for (let i = 0; i < versions; i += 1) {
        finalVariants.push({ ...stub })
      }
    }

    const perPlatformCounts = Object.fromEntries(
      selected.map((platform) => [platform, (aggregator.get(platform) || []).length])
    )

    const finalMeta = {
      model: modelsUsed.size ? Array.from(modelsUsed).join(',') : (data.modelPref || OPENAI_PRIMARY_MODEL),
      promptVersion,
      platforms: selected,
      versions,
      salvaged: salvagedAny,
      triedPlain: triedPlainAny,
      counts: perPlatformCounts,
      backfilled: backfilledAny,
      runId,
    }

    console.log(`[RUN ${runId}] READY variants=${finalVariants.length} salvaged=${finalMeta.salvaged ? 'yes' : 'no'}`, {
      perPlatformCounts,
    })

    update(runId, 'ready', { variants: finalVariants, meta: finalMeta })
  } catch (error) {
    const status = error?.status || error?.response?.status
    const code = error?.code || error?.response?.data?.error?.code
    const msg = error?.response?.data?.error?.message || error?.message || 'provider_error'
    console.error('[provider_error]', { status, code, msg })
    update(runId, 'error', null, `provider_error: ${code || status || 'unknown'} — ${msg}`)
  }
}

function update(id, status, data = undefined, error = undefined) {
  const previous = RUNS.get(id) || { startedAt: Date.now() }
  const next = {
    ...previous,
    status,
    updatedAt: Date.now(),
  }

  if (data !== undefined) {
    next.data = data
  } else if (!('data' in next)) {
    next.data = null
  }

  if (status === 'error') {
    next.error = typeof error === 'string' ? error : 'provider_error'
  } else if (error !== undefined) {
    next.error = error
  } else {
    next.error = null
  }

  RUNS.set(id, next)
  bus.publish(id, next)
  return next
}

app.listen(process.env.PORT || 8787, () => {
  console.log(`AI Gateway listening on ${process.env.PORT || 8787}`)
})
