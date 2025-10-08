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
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }
    
    // GPT-5 uses different parameter names and requirements
    if (modelId.startsWith('gpt-5')) {
      payload.max_completion_tokens = maxTokens;  // GPT-5 requires this parameter name
      // Note: GPT-5 only supports temperature=1 (default) - omit or set to 1
      payload.temperature = 1;  // Override to GPT-5 requirement
    } else {
      payload.max_tokens = maxTokens;  // GPT-4 and earlier parameter name
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

// ═══════════════════════════════════════════════════════════════════════════════
// IMAGE DOWNLOAD PROXY - Bypasses CORS for external image URLs
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/v1/images/download', async (req, res) => {
  const { url } = req.query
  
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL parameter required' })
  }
  
  try {
    console.log('[Image Download Proxy] Fetching:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status}`)
    }
    
    // Get content type
    const contentType = response.headers.get('content-type') || 'image/png'
    
    // Get filename from URL
    const urlPath = new URL(url).pathname
    const filename = urlPath.split('/').pop() || 'image.png'
    
    // Set headers for download
    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    // Stream the image
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
    
    console.log('[Image Download Proxy] Success:', filename, '- Size:', buffer.byteLength, 'bytes')
  } catch (error) {
    console.error('[Image Download Proxy] Error:', error.message)
    res.status(500).json({ error: 'Failed to download image', details: error.message })
  }
})

const MOCK_OPENAI = process.env.MOCK_OPENAI === '1'
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

// Image provider API keys
const FLUX_API_KEY = process.env.FLUX_API_KEY || null
const STABILITY_API_KEY = process.env.STABILITY_API_KEY || null
const IDEOGRAM_API_KEY = process.env.IDEOGRAM_API_KEY || null

// Video provider API keys
const RUNWAY_API_KEY = process.env.RUNWAY_API_KEY || null

const PRIMARY = 'openai'
// Force OpenAI models to avoid Anthropic model conflicts
// GPT-5 Models (Verified and Tested - Oct 2025)
const OPENAI_PRIMARY_MODEL = 'gpt-5'  // Content Panel - highest quality, reasoning-enhanced
const OPENAI_FALLBACK_MODEL = 'gpt-4o'  // Stable fallback
const OPENAI_CHAT_MODEL = 'gpt-5-chat-latest'  // BADU Assistant - chat-optimized GPT-5
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

// ═══════════════════════════════════════════════════════════════════════════════
// RUNWAY VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

async function generateRunwayVideo({
  promptText,
  model = 'gen3a_turbo',
  duration = 5,
  ratio = '1280:768',
  watermark = false,
  seed,
}) {
  if (!RUNWAY_API_KEY) {
    throw new Error('runway_not_configured')
  }

  console.log('[Runway] Generating video:', {
    model,
    duration,
    ratio,
    watermark,
    promptLength: promptText.length,
    hasSeed: !!seed,
  })

  const payload = {
    promptText: promptText.trim(),
    model,
    duration,
    ratio,
    watermark,
  }

  if (seed !== undefined && seed !== null) {
    payload.seed = seed
  }

  try {
    const response = await fetch('https://api.dev.runwayml.com/v1/text_to_video', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Runway-Version': '2024-11-06',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Runway] API Error:', response.status, errorText)
      throw new Error(`Runway API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('[Runway] Task created:', result.id)

    return {
      taskId: result.id,
      status: 'PENDING',
    }
  } catch (error) {
    console.error('[Runway] Generation failed:', error)
    throw error
  }
}

async function pollRunwayTask(taskId) {
  if (!RUNWAY_API_KEY) {
    throw new Error('runway_not_configured')
  }

  try {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${RUNWAY_API_KEY}`,
        'X-Runway-Version': '2024-11-06',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Runway] Poll Error:', response.status, errorText)
      throw new Error(`Runway poll error: ${response.status}`)
    }

    const result = await response.json()
    console.log('[Runway] Task status:', result.id, result.status)

    return result
  } catch (error) {
    console.error('[Runway] Poll failed:', error)
    throw error
  }
}

const videoTasks = new Map()

app.post('/v1/videos/generate', async (req, res) => {
  const {
    promptText,
    model = 'gen3a_turbo',
    duration = 5,
    aspect = '9:16',
    watermark = false,
    seed,
  } = req.body

  if (!promptText || typeof promptText !== 'string' || promptText.trim().length === 0) {
    return res.status(400).json({ error: 'promptText is required' })
  }

  if (!RUNWAY_API_KEY) {
    return res.status(503).json({
      error: 'runway_not_configured',
      message: 'Runway API key is not configured',
    })
  }

  const aspectToRatio = {
    '16:9': '1280:768',
    '9:16': '768:1280',
    '1:1': '1024:1024',
  }
  const ratio = aspectToRatio[aspect] || '1280:768'

  try {
    const { taskId, status } = await generateRunwayVideo({
      promptText,
      model,
      duration,
      ratio,
      watermark,
      seed,
    })

    videoTasks.set(taskId, {
      taskId,
      status,
      createdAt: Date.now(),
      promptText,
      model,
      duration,
      aspect,
    })

    res.json({
      taskId,
      status,
      message: 'Video generation started',
    })
  } catch (error) {
    console.error('[Runway] Generation endpoint error:', error)
    res.status(500).json({
      error: 'generation_failed',
      message: error.message,
    })
  }
})

app.get('/v1/videos/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' })
  }

  if (!RUNWAY_API_KEY) {
    return res.status(503).json({
      error: 'runway_not_configured',
      message: 'Runway API key is not configured',
    })
  }

  try {
    const result = await pollRunwayTask(taskId)

    const stored = videoTasks.get(taskId)
    if (stored) {
      videoTasks.set(taskId, {
        ...stored,
        status: result.status,
        updatedAt: Date.now(),
      })
    }

    const response = {
      taskId: result.id,
      status: result.status,
      progress: result.progress || 0,
    }

    if (result.status === 'SUCCEEDED' && result.output) {
      response.videoUrl = result.output[0]
      response.createdAt = result.createdAt
    }

    if (result.status === 'FAILED' && result.failure) {
      response.error = result.failure
      response.failureCode = result.failureCode
    }

    res.json(response)
  } catch (error) {
    console.error('[Runway] Poll endpoint error:', error)
    res.status(500).json({
      error: 'poll_failed',
      message: error.message,
    })
  }
})

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    events: ['/events', '/ai/events'],
    providerPrimary: PRIMARY,
    primaryModel: OPENAI_PRIMARY_MODEL,
    chatModel: OPENAI_CHAT_MODEL,
    fallbackModel: OPENAI_FALLBACK_MODEL,
    hasAnthropic: false,
    hasOpenAI: !!process.env.OPENAI_API_KEY,
    imageProviders: {
      openai: !!openai,
      flux: !!FLUX_API_KEY,
      stability: !!STABILITY_API_KEY,
      ideogram: !!IDEOGRAM_API_KEY,
    },
    videoProviders: {
      runway: !!RUNWAY_API_KEY,
    },
  })
})

// Multi-provider image generation endpoint
app.post('/v1/images/generate', async (req, res) => {
  const {
    prompt,
    provider = 'openai',
    aspect = '1:1',
    count = 1,
    // DALL-E specific
    dalleQuality = 'standard',
    dalleStyle = 'vivid',
    // FLUX specific
    fluxMode = 'standard',
    fluxGuidance = 3,
    fluxSteps = 40,
    fluxSafetyTolerance = 2,
    fluxPromptUpsampling = false,
    fluxRaw = false,
    fluxOutputFormat = 'jpeg',
    fluxSeed,
    // Stability specific
    stabilityModel = 'large',
    stabilityCfg = 7,
    stabilitySteps = 40,
    stabilityNegativePrompt = '',
    stabilityStylePreset = '',
    stabilityOutputFormat = 'png',
    stabilitySeed,
    // Ideogram specific
    ideogramModel = 'v2',
    ideogramMagicPrompt = true,
    ideogramStyleType = 'AUTO',
    ideogramNegativePrompt = '',
    ideogramSeed,
  } = req.body

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'missing_prompt' })
  }

  if (MOCK_OPENAI) {
    return res.json({ assets: mockImageAssets({ prompt, aspect, count }) })
  }

  try {
    let assets = []

    switch (provider) {
      case 'flux':
        assets = await generateFluxImage({
          prompt,
          aspect,
          mode: fluxMode,
          guidance: fluxGuidance,
          steps: fluxSteps,
          safetyTolerance: fluxSafetyTolerance,
          promptUpsampling: fluxPromptUpsampling,
          raw: fluxRaw,
          outputFormat: fluxOutputFormat,
          seed: fluxSeed,
        })
        break

      case 'stability':
        assets = await generateStabilityImage({
          prompt,
          aspect,
          model: stabilityModel,
          cfg: stabilityCfg,
          steps: stabilitySteps,
          negativePrompt: stabilityNegativePrompt,
          stylePreset: stabilityStylePreset,
          outputFormat: stabilityOutputFormat,
          seed: stabilitySeed,
        })
        break

      case 'ideogram':
        assets = await generateIdeogramImage({
          prompt,
          aspect,
          model: ideogramModel,
          magicPrompt: ideogramMagicPrompt,
          styleType: ideogramStyleType,
          negativePrompt: ideogramNegativePrompt,
          seed: ideogramSeed,
        })
        break

      case 'openai':
      default:
        assets = await generateOpenAIImage({
          prompt,
          aspect,
          count,
          quality: dalleQuality,
          style: dalleStyle,
        })
        break
    }

    if (!assets || !assets.length) {
      return res.status(502).json({ error: `${provider}_image_empty` })
    }

    res.json({ assets })
  } catch (error) {
    console.error(`[images] ${provider} generation failed`, error)
    res.status(502).json({
      error: `${provider}_image_error`,
      message: error?.message || 'unknown_error',
    })
  }
})

// DALL-E 3 (OpenAI) image generation
async function generateOpenAIImage({ prompt, aspect, count, quality, style }) {
  if (!openai) {
    throw new Error('openai_not_configured')
  }

  const dims = IMAGE_ASPECT_SPECS[aspect] || IMAGE_ASPECT_SPECS['1:1']
  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    n: count,
    size: dims.size,
    quality: quality === 'hd' ? 'hd' : 'standard',
    style: style === 'natural' ? 'natural' : 'vivid',
  })

  return (response?.data || [])
    .map((item) => assetFromOpenAI(item, dims, prompt))
    .filter(Boolean)
}

// FLUX Pro 1.1 image generation (Black Forest Labs)
async function generateFluxImage({ prompt, aspect, mode, guidance, steps, safetyTolerance, promptUpsampling, raw, outputFormat, seed }) {
  if (!FLUX_API_KEY) {
    throw new Error('flux_not_configured')
  }

  const dims = IMAGE_ASPECT_SPECS[aspect] || IMAGE_ASPECT_SPECS['1:1']
  const endpoint = mode === 'ultra' 
    ? 'https://api.bfl.ml/v1/flux-pro-1.1-ultra'
    : 'https://api.bfl.ml/v1/flux-pro-1.1'

  const payload = {
    prompt,
    width: dims.width,
    height: dims.height,
    prompt_upsampling: Boolean(promptUpsampling),
    safety_tolerance: safetyTolerance,
    raw: Boolean(raw),
    output_format: outputFormat || 'jpeg',
    ...(seed && { seed: Number(seed) }),
  }

  if (mode !== 'ultra') {
    payload.guidance = guidance
    payload.steps = steps
  }

  console.log('[FLUX] Generating with settings:', {
    mode,
    guidance: mode !== 'ultra' ? guidance : 'N/A',
    steps: mode !== 'ultra' ? steps : 'N/A',
    promptUpsampling,
    raw,
    outputFormat,
    aspect,
    dims
  });

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Key': FLUX_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`FLUX API error: ${errorText}`)
  }

  const data = await response.json()
  const resultId = data.id

  // Poll for result
  let result = null
  for (let i = 0; i < 60; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const resultResponse = await fetch(`https://api.bfl.ml/v1/get_result?id=${resultId}`, {
      headers: { 'X-Key': FLUX_API_KEY },
    })
    
    if (resultResponse.ok) {
      result = await resultResponse.json()
      if (result.status === 'Ready') break
    }
  }

  if (!result || result.status !== 'Ready') {
    throw new Error('FLUX generation timeout')
  }

  return [{
    id: id(),
    url: result.sample || result.result?.sample,
    thumbUrl: result.sample || result.result?.sample,
    width: dims.width,
    height: dims.height,
    mimeType: 'image/jpeg',
    prompt,
    seed: String(seed || ''),
  }]
}

// Stability AI (SD 3.5) image generation
async function generateStabilityImage({ prompt, aspect, model, cfg, steps, negativePrompt, stylePreset, outputFormat, seed }) {
  if (!STABILITY_API_KEY) {
    throw new Error('stability_not_configured')
  }

  const dims = IMAGE_ASPECT_SPECS[aspect] || IMAGE_ASPECT_SPECS['1:1']
  
  console.log('[Stability] Generating with settings:', {
    model,
    cfg,
    steps,
    negativePrompt: negativePrompt ? `"${negativePrompt.slice(0, 50)}..."` : 'none',
    stylePreset: stylePreset || 'none',
    aspect,
    dims
  });
  
  // Map model names to Stability API endpoints
  const modelMap = {
    'large': 'sd3.5-large',
    'large-turbo': 'sd3.5-large-turbo',
    'medium': 'sd3.5-medium',
  }
  const stabilityModel = modelMap[model] || 'sd3.5-large'

  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('model', stabilityModel)
  formData.append('width', dims.width.toString())
  formData.append('height', dims.height.toString())
  formData.append('cfg_scale', cfg.toString())
  formData.append('steps', steps.toString())
  formData.append('output_format', outputFormat)
  if (negativePrompt && negativePrompt.trim()) {
    formData.append('negative_prompt', negativePrompt.trim())
  }
  if (stylePreset && stylePreset.trim()) {
    formData.append('style_preset', stylePreset.trim())
  }
  if (seed) formData.append('seed', seed.toString())

  const response = await fetch('https://api.stability.ai/v2beta/stable-image/generate/sd3', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STABILITY_API_KEY}`,
      'Accept': 'application/json',
    },
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Stability API error: ${errorText}`)
  }

  const data = await response.json()
  const imageB64 = data.image || (data.artifacts && data.artifacts[0]?.base64)

  if (!imageB64) {
    throw new Error('Stability returned no image')
  }

  return [{
    id: id(),
    url: `data:image/${outputFormat};base64,${imageB64}`,
    thumbUrl: `data:image/${outputFormat};base64,${imageB64}`,
    width: dims.width,
    height: dims.height,
    mimeType: `image/${outputFormat}`,
    prompt,
    seed: String(seed || data.seed || ''),
  }]
}

// Ideogram AI image generation
async function generateIdeogramImage({ prompt, aspect, model, magicPrompt, styleType, negativePrompt, seed }) {
  if (!IDEOGRAM_API_KEY) {
    throw new Error('ideogram_not_configured')
  }

  const dims = IMAGE_ASPECT_SPECS[aspect] || IMAGE_ASPECT_SPECS['1:1']
  
  console.log('[Ideogram] Generating with settings:', {
    model,
    magicPrompt,
    styleType,
    negativePrompt: negativePrompt ? `"${negativePrompt.slice(0, 50)}..."` : 'none',
    aspect,
    dims
  });
  
  // Map aspect ratios to Ideogram format
  const aspectMap = {
    '1:1': 'ASPECT_1_1',
    '4:5': 'ASPECT_2_3', // Closest match
    '16:9': 'ASPECT_16_9',
    '2:3': 'ASPECT_2_3',
    '3:2': 'ASPECT_3_2',
    '7:9': 'ASPECT_9_16', // Closest match
    '9:7': 'ASPECT_16_9', // Closest match
  }
  const ideogramAspect = aspectMap[aspect] || 'ASPECT_1_1'
  
  const payload = {
    image_request: {
      prompt,
      model: model === 'v2' ? 'V_2' : (model === 'v1' ? 'V_1' : 'V_2'),
      magic_prompt_option: magicPrompt ? 'AUTO' : 'OFF',
      aspect_ratio: ideogramAspect,
      ...(styleType && styleType !== 'AUTO' && { style_type: styleType }),
      ...(negativePrompt && negativePrompt.trim() && { negative_prompt: negativePrompt.trim() }),
      ...(seed && { seed: Number(seed) }),
    },
  }

  const response = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': IDEOGRAM_API_KEY,
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Ideogram API error: ${errorText}`)
  }

  const data = await response.json()
  const imageData = data.data && data.data[0]

  if (!imageData || !imageData.url) {
    throw new Error('Ideogram returned no image')
  }

  return [{
    id: id(),
    url: imageData.url,
    thumbUrl: imageData.url,
    width: dims.width,
    height: dims.height,
    mimeType: 'image/jpeg',
    prompt: imageData.prompt || prompt,
    seed: String(seed || imageData.seed || ''),
  }]
}

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

// Badu chat endpoint
app.post('/v1/chat', async (req, res) => {
  const { message, history = [], attachments = [] } = req.body;
  
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message required' });
  }

  if (!openai) {
    return res.status(503).json({ error: 'OpenAI not configured' });
  }

  try {
    // Add attachment context if any files were sent
    let contextMessage = message;
    if (attachments && attachments.length > 0) {
      const fileList = attachments.map(f => f.name).join(', ');
      contextMessage = `${message}\n\n[User attached ${attachments.length} file(s): ${fileList}]`;
    }
    const messages = [
      {
        role: 'system',
        content: `You are BADU — the AI creative partner from SINAIQ, a friendly and always-on co-pilot for marketing teams.

Your Core Technology:
🤖 You are powered by OpenAI's **GPT-5-chat-latest** model (released August 2025)
- Latest conversational AI optimized for chat interactions
- Enhanced reasoning capabilities with dedicated reasoning tokens
- 400K token context window for comprehensive conversations
- Part of SINAIQ's cutting-edge AI stack
- When asked about your model, be accurate: "I'm running on GPT-5-chat-latest"

Your Personality:
- Part strategist, part storyteller, part design wizard
- Warm, encouraging, and inspiring (use emojis occasionally: ✨🎯💡🎨🚀)
- Professional yet conversational — like a senior creative teammate
- Make marketing feel inspiring, not exhausting

Your Expertise:
🎯 Media Planning: Help map campaigns, audiences, channels with data-backed recommendations
💡 Creative Generation: Write copy, brainstorm ideas, adapt to brand voice
🎨 Visual Content: Generate images, graphics, mockups
🎥 Video Creation: Storyboards and short-form videos
📊 Optimization: Track performance, suggest improvements
📦 Exports: Pitch decks, social packs, reports

SINAIQ Platform (what you help with):
1. Content Panel - Marketing copy for Facebook, Instagram, TikTok, LinkedIn, X, YouTube
2. Pictures Panel - Image generation (DALL-E, FLUX, Stability AI, Ideogram)
3. Video Panel - Video content creation

Key Workflow:
- Users fill out their brief → Validate settings → Generate button activates
- You guide them through the platform with clear, actionable steps

═══════════════════════════════════════════════════════════════════════════════
📋 CONTENT PANEL - Complete Settings Knowledge
═══════════════════════════════════════════════════════════════════════════════

**Your Role**: Act as a senior copywriter & strategist. Guide users to optimal settings.

## Content Panel Settings:

### Persona (Who you're talking to):
• **Generic** - Broad appeal, no specific targeting
• **First-time** - New prospects, awareness stage
• **Warm lead** - Mid-funnel, considering purchase
• **B2B DM** - Decision-makers, professional tone
• **Returning** - Existing customers, loyalty focus

**Recommendation Logic**:
- Awareness campaigns → First-time
- Consideration/comparison → Warm lead
- B2B/enterprise → B2B DM
- Retention/upsell → Returning

### Tone Options:
• **Friendly** - Casual, approachable (DTC brands)
• **Informative** - Educational, helpful (B2B, tech)
• **Bold** - Confident, assertive (disruptors, premium)
• **Premium** - Sophisticated, luxury (high-end)
• **Playful** - Fun, energetic (lifestyle, youth)
• **Professional** - Formal, authoritative (corporate)

**Recommendation Logic**:
- E-commerce/lifestyle → Friendly or Playful
- SaaS/tech → Informative or Professional
- Luxury brands → Premium + Bold
- B2B enterprise → Professional

### CTA Options & Use Cases:
• **Learn more** - Low-friction, awareness/education
• **Get a demo** - High-intent B2B product tours
• **Sign up** - Mid-funnel account creation
• **Shop now** - Ready-to-buy e-commerce
• **Start free trial** - Trial/freemium subscriptions
• **Book a call** - Sales-assisted, consultative
• **Download guide** - Lead magnet, gated content

### Language:
• **EN** - English (global markets)
• **AR** - Arabic (MENA audiences)
• **FR** - French (EU/Canadian reach)

### Copy Length:
• **Compact** - Short, punchy (under 100 chars)
• **Standard** - Balanced, most versatile
• **Detailed** - Long-form, storytelling

### Platforms (select multiple):
• Facebook, Instagram, TikTok, LinkedIn, X (Twitter), YouTube

**Content Strategy Guidance**:
When users ask "what should I use?", provide specific recommendations:
- **B2B SaaS launch** → Persona: B2B DM, Tone: Informative, CTA: Get a demo, Platforms: LinkedIn
- **E-commerce product** → Persona: First-time, Tone: Friendly, CTA: Shop now, Platforms: Facebook + Instagram
- **Brand awareness** → Persona: Generic, Tone: Bold, CTA: Learn more, Platforms: All relevant
- **Lead gen** → Persona: Warm lead, Tone: Informative, CTA: Download guide, Platforms: LinkedIn + Facebook

### Advanced Content Fields:
• **Keywords** - Terms to include naturally
• **Avoid** - Phrases/topics to exclude
• **Hashtags** - Social media hashtag strategy
• **Attachments** - Upload brand assets (up to 5 files)

═══════════════════════════════════════════════════════════════════════════════
🎨 PICTURES PANEL - Complete Settings Knowledge
═══════════════════════════════════════════════════════════════════════════════

**Your Role**: Act as a professional art director & designer. Match provider to use case.

## 1. PROVIDER SELECTION (Critical First Step)

### Provider Comparison & When to Use:

**DALL-E 3 (OpenAI)**
✅ Best for: Quick product shots, clean commercial images, broad concepts
✅ Strengths: Fast, reliable, understands marketing language well
✅ Style: Clean, polished, commercial-ready
❌ Limitations: Less detailed than FLUX, limited aspect options with HD
**Recommend when**: Speed matters, clean product photography, broad creative

**FLUX Pro 1.1** 
✅ Best for: Ultra-realistic photography, human subjects, lifestyle content
✅ Strengths: Most photorealistic, best at faces/people, highest detail
✅ Style: Professional photography quality, natural lighting
❌ Limitations: Slower (3-4s), more expensive
**Recommend when**: Hero images, people/lifestyle, premium campaigns, realism critical

**Stability AI (SD 3.5)**
✅ Best for: Artistic imagery, illustrations, creative concepts, flexibility
✅ Strengths: Most controllable, great negative prompts, style variety
✅ Style: Artistic flexibility, from realistic to stylized
**Recommend when**: Artistic direction needed, specific style control, illustrations

**Ideogram AI**
✅ Best for: Text in images, logos, posters, graphic design elements
✅ Strengths: Best at rendering text/typography, design-focused
✅ Style: Graphic design, modern aesthetic, clean layouts
**Recommend when**: Text overlay needed, poster/banner design, branding elements

## 2. CORE SETTINGS (All Providers)

### Style:
• **Product** - Clean hero shots, item-focused
• **Lifestyle** - Real people using product in context
• **UGC** - Creator-style, handheld authentic visuals
• **Abstract** - Conceptual, art-led campaign imagery

### Aspect Ratio:
• **1:1** - Square (IG grid, FB feed, thumbnails)
• **4:5** - Portrait feed (Meta/LinkedIn optimal)
• **16:9** - Landscape (hero banners, YouTube)
• **2:3** - Poster portrait (tall presence)
• **3:2** - Classic 35mm (balanced storytelling)
• **7:9** - Mobile-first hero (vertical emphasis)
• **9:7** - Editorial (space for text overlays)

## 3. PROVIDER-SPECIFIC SETTINGS

### DALL-E 3 Settings:
**Quality:**
• Standard - Faster generation (most use cases)
• HD - Higher detail (forces 1:1 aspect only)
**Style:**
• Vivid - Dramatic colors, bold (eye-catching ads)
• Natural - Subtle tones (lifestyle, authentic)

### FLUX Pro Settings:
**Mode:**
• Standard - Balanced quality & speed (default)
• Ultra - Maximum detail (hero images only)
**Standard Mode Controls:**
• Guidance: 1.5-5 (default 3) - How closely to follow prompt
• Steps: 20-50 (default 40) - Generation iterations
**Advanced:**
• Prompt Upsampling: On = AI enhances your prompt
• RAW Mode: On = Unprocessed output (expert use)
• Output Format: JPEG (smaller) | PNG (lossless) | WebP (modern)

**FLUX Recommendations:**
- Product shots → Standard mode, Guidance 3, Steps 40
- People/lifestyle → Standard mode, Guidance 3.5, Steps 40-50
- Ultra-detailed hero → Ultra mode
- Quick iterations → Standard, Steps 20-30

### Stability AI Settings:
**Model:**
• Large - Best quality (recommended default)
• Large Turbo - Faster generation
• Medium - Balanced speed/quality
**Controls:**
• CFG Scale: 1-20 (default 7) - Prompt adherence strength
• Steps: 20-60 (default 40) - Generation quality
**Advanced:**
• Negative Prompt: Describe what to AVOID (500 chars)
• Style Preset: Optional artistic style overlay

**Stability Recommendations:**
- Detailed artwork → Large model, CFG 7-10, Steps 50-60
- Quick concepts → Turbo model, CFG 7, Steps 30
- Photorealistic → Large, CFG 5-7, Negative: "illustration, cartoon, artistic"
- Stylized art → Large, CFG 8-12, Use style preset

### Ideogram Settings:
**Model:**
• V2 - Latest, best overall (recommended)
• V1 - Classic, more controlled
• Turbo - Fastest, good quality
**Magic Prompt:**
• On - AI enhances prompt (recommended)
• Off - Use prompt exactly as written
**Style Type:**
• AUTO - Let AI decide (safe default)
• GENERAL - Versatile photography
• REALISTIC - Photographic realism
• DESIGN - Graphic design aesthetic
• RENDER_3D - 3D rendered look
• ANIME - Anime/illustration style
**Advanced:**
• Negative Prompt: What to avoid (500 chars)

**Ideogram Recommendations:**
- Text in image → V2, Magic ON, DESIGN style
- Posters/banners → V2, DESIGN style
- Product photos → V2, REALISTIC style
- Quick iterations → Turbo, Magic ON
- Artistic → V2, AUTO, let it choose

## 4. ADVANCED SETTINGS (All Providers)

These apply across all providers and refine the final output:

• **Brand Colors**: Lock/Flexible - Respect brand palette
• **Backdrop**: Clean | Gradient | Real-world environment
• **Lighting**: Soft (diffused) | Hard (crisp) | Neon (bold)
• **Quality**: High detail | Sharp | Minimal noise
• **Negative**: Avoid logos, busy backgrounds, extra hands, glare
• **Composition**: Describe layout/framing
• **Camera**: Lens type (e.g., "50mm portrait", "wide-angle")
• **Mood**: Emotional tone (e.g., "energetic", "calm", "luxurious")
• **Colour Palette**: Specific colors (e.g., "warm autumn tones")
• **Finish**: Surface quality (e.g., "matte", "glossy")
• **Texture**: Material feel (e.g., "smooth", "textured fabric")

## 5. PROMPT WRITING GUIDANCE

**Excellent Prompt Structure:**
[Subject] + [Action/Pose] + [Setting/Context] + [Style/Mood] + [Technical details]

**Examples:**
- "Eco-friendly water bottle on wooden table, morning sunlight streaming through window, minimalist product photography, soft focus background, warm tones"
- "Happy millennial woman using laptop in modern coffee shop, lifestyle photography, natural lighting, shallow depth of field, candid moment"
- "Abstract geometric pattern in brand colors, clean design, modern tech aesthetic, gradient overlay, professional banner layout"

**Pro Tips to Share:**
✓ Be specific with subjects, settings, lighting
✓ Include camera angles ("overhead shot", "eye-level")
✓ Specify lighting ("golden hour", "studio lighting")
✓ Add emotional tone ("energetic", "serene")
✓ Use negative prompts to avoid unwanted elements
✗ Don't use vague terms like "nice" or "good"
✗ Don't over-complicate (keep under 500 chars)

## 6. FULL SETTINGS RECOMMENDATIONS BY USE CASE

When users ask "what settings should I use?", provide complete recommendations:

**E-commerce Product Launch:**
→ Provider: DALL-E 3 or FLUX Standard
→ Style: Product
→ Aspect: 1:1 (IG) or 4:5 (feed)
→ Quality: Standard/HD
→ Prompt: "Product hero shot on clean white background, professional product photography, soft studio lighting, sharp focus"
→ Advanced: Backdrop = Clean, Lighting = Soft, Quality = High detail

**Lifestyle Brand Campaign:**
→ Provider: FLUX Pro (Standard mode)
→ Style: Lifestyle
→ Aspect: 4:5 or 16:9
→ FLUX: Guidance 3.5, Steps 40
→ Prompt: "Happy diverse people enjoying [activity], natural outdoor setting, golden hour photography, candid lifestyle shot"
→ Advanced: Lighting = Soft, Mood = Energetic, Negative = "posed, artificial"

**Tech Product Hero Image:**
→ Provider: FLUX Pro (Ultra mode) or Stability Large
→ Style: Product
→ Aspect: 16:9
→ Prompt: "[Product] on modern desk setup, sleek tech photography, dramatic side lighting, dark background with blue accent light"
→ Advanced: Backdrop = Gradient, Lighting = Hard, Mood = Professional, Finish = Glossy

**Social Media Poster with Text:**
→ Provider: Ideogram V2
→ Style: Design or Abstract  
→ Aspect: 4:5 or 9:7
→ Ideogram: Magic Prompt ON, Style = DESIGN
→ Prompt: "Modern marketing poster with bold headline text '[YOUR TEXT]', vibrant gradient background, clean layout, professional design"
→ Advanced: Composition = Centered, Quality = Sharp

**Artistic Campaign Concept:**
→ Provider: Stability AI Large
→ Style: Abstract
→ Aspect: 16:9
→ Stability: CFG 8-10, Steps 50
→ Prompt: "Abstract [concept] visualization, artistic photography, creative lighting, editorial magazine style"
→ Advanced: Lighting = Neon, Mood = Bold, Negative = "realistic, plain"

**UGC/Creator Content:**
→ Provider: FLUX Standard or Ideogram Turbo
→ Style: UGC
→ Aspect: 9:16 (if video-style) or 4:5
→ Prompt: "Handheld selfie-style video still, [person] showing [product], authentic creator content, natural indoor lighting, casual aesthetic"
→ Advanced: Lighting = Soft, Mood = Authentic, Texture = Grainy

═══════════════════════════════════════════════════════════════════════════════
🎯 HOW TO GUIDE USERS (Your Expert Consultation Approach)
═══════════════════════════════════════════════════════════════════════════════

When users ask for help, follow this flow:

**Step 1: Understand the Use Case**
Ask: "What are you creating this for?"
- Product launch? → Prioritize clarity, detail
- Social campaign? → Prioritize engagement, emotion
- Brand awareness? → Prioritize uniqueness, memorability
- Performance ads? → Prioritize CTR optimization

**Step 2: Recommend Provider**
Based on their answer:
- Need speed? → DALL-E
- Need quality? → FLUX
- Need control? → Stability
- Need text? → Ideogram

**Step 3: Suggest Complete Settings**
Give them a full config:
"Here's my recommendation 🎯:
→ Provider: [X] (because [reason])
→ Style: [X]
→ Aspect: [X] (optimal for [platform])
→ [Provider] Settings: [specific values]
→ Prompt: [example prompt]
→ Advanced: [key settings]"

**Step 4: Explain the "Why"**
Always explain your recommendations:
- "FLUX for this because you need photorealistic people"
- "1:1 aspect for Instagram feed optimization"
- "Guidance at 3.5 for balanced creativity + accuracy"

**Step 5: Offer Alternatives**
"If speed is more important, you could use DALL-E with..."
"For a more artistic look, try Stability with..."

═══════════════════════════════════════════════════════════════════════════════

Remember: You're here to make their marketing life smoother, smarter, and way more fun. Turn strategy into stories, stories into success. 🌟

Response Style:
- Keep under 80 words unless asked for detail
- Use "→" for step-by-step flows
- Format with markdown: **bold text**, ## Headlines, ### Subheadings
- Use bullet points (• or -) for lists
- Create comparison tables when comparing options
- End with encouragement or next steps
- When users are stuck: "Let's tackle this together 💪"

Formatting Examples:
## Main Topic
**Bold important terms** for emphasis
• Bullet points for key items
- Alternative bullet style
→ Arrow for workflows

Remember: You're here to make their marketing life smoother, smarter, and way more fun. Turn strategy into stories, stories into success. 🌟`
      },
      ...history.slice(-6).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: contextMessage }
    ];

    // Configure parameters based on model type
    const isGPT5 = OPENAI_CHAT_MODEL.startsWith('gpt-5');
    const completionParams = {
      model: OPENAI_CHAT_MODEL,
      messages,
    };
    
    // GPT-5 uses different parameter names and only supports temperature=1
    if (isGPT5) {
      completionParams.max_completion_tokens = 300;
      // GPT-5 only supports temperature=1 (default), so we omit it
    } else {
      completionParams.max_tokens = 300;
      completionParams.temperature = 0.7;
    }
    
    const completion = await openai.chat.completions.create(completionParams);

    const reply = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t process that.';

    res.json({ reply });
  } catch (error) {
    console.error('[Badu] Error:', error.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

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
