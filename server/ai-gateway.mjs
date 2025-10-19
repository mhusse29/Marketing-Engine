import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import OpenAI from 'openai'
import { config } from 'dotenv'
import { resolve } from 'path'
import { BADU_KNOWLEDGE } from '../shared/badu-knowledge.js'
import { buildBaduMessages, isBaduTopic, sanitizeBaduReply } from './badu-context.js'
import usageTracker from './usageTracker.mjs'
import extractUserIdMiddleware from './authMiddleware.mjs'
import analyticsScheduler from './analyticsScheduler.mjs'
import feedbackTracker from './feedbackTracker.mjs'

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
  if (!openai) return ''

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



function sendSSEReply(res, message) {
  const chunks = message.match(/.{1,80}/g) || []
  if (chunks.length === 0) {
    res.write(`data: ${JSON.stringify({ token: message })}\n\n`)
  } else {
    for (const chunk of chunks) {
      res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`)
    }
  }
  res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
  res.end()
}

async function fetchContinuation({ messages, model, partial, temperature = 0.65, maxTokens = 600 }) {
  if (!openai) return ''
  try {
    const continuationMessages = [
      ...messages,
      { role: 'assistant', content: partial.trim() },
      {
        role: 'user',
        content: 'Please continue the same response and finish any remaining details while keeping the same structure.',
      },
    ]

    const completion = await openai.chat.completions.create({
      model,
      messages: continuationMessages,
      max_tokens: maxTokens,
      temperature,
    })

    return completion.choices?.[0]?.message?.content || ''
  } catch (error) {
    console.error('[Badu] continuation failed', error)
    return ''
  }
}

function ensurePolishedEnding(raw = '') {
  const trimmed = raw.trim()
  if (!trimmed) return ''
  if (/[.!?…]$/u.test(trimmed)) {
    return trimmed
  }
  return `${trimmed}…`
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
app.use(express.json({ limit: '50mb' })) // Increased limit for image attachments
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// Add auth middleware to extract user ID from requests
app.use(extractUserIdMiddleware)

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
const LUMA_API_KEY = process.env.LUMA_API_KEY || null

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

const RUNWAY_VIDEO_MODELS = new Set([
  'veo3', // Only model available in Tier 1
])

async function generateRunwayVideo({
  promptText,
  promptImage,
  model = 'veo3', // veo3 available in Tier 1
  duration = 8, // veo3 requires 8 seconds
  ratio = '1280:720',
  watermark = false,
  seed,
}) {
  if (!RUNWAY_API_KEY) {
    throw new Error('runway_not_configured')
  }

  if (!RUNWAY_VIDEO_MODELS.has(model)) {
    throw Object.assign(new Error('runway_model_not_supported'), {
      statusCode: 400,
      details: { model },
    })
  }

  const normalizedDuration = model === 'veo3' ? 8 : duration

  console.log('[Runway] Generating video:', {
    model,
    duration: normalizedDuration,
    ratio,
    watermark,
    promptLength: promptText.length,
    hasSeed: !!seed,
  })

  const payload = {
    promptText: promptText.trim(),
    model,
    duration: normalizedDuration,
    ratio,
    watermark,
  }

  if (seed !== undefined && seed !== null) {
    payload.seed = seed
  }

  // Determine endpoint based on whether we have an image
  const endpoint = promptImage 
    ? 'https://api.dev.runwayml.com/v1/image_to_video' 
    : 'https://api.dev.runwayml.com/v1/text_to_video'

  // Add image if provided
  if (promptImage) {
    payload.promptImage = promptImage
    console.log('[Runway] Using image-to-video endpoint')
  }

  try {
    const response = await fetch(endpoint, {
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
      const error = new Error(`Runway API error: ${response.status}`)
      error.statusCode = response.status
      error.raw = errorText
      throw error
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

// ═══════════════════════════════════════════════════════════════════════════════
// LUMA VIDEO GENERATION
// ═══════════════════════════════════════════════════════════════════════════════

const LUMA_VIDEO_MODELS = new Set([
  'ray-2', // Currently available Luma model
])

async function generateLumaVideo({
  promptText,
  promptImage,
  model = 'ray-2',
  aspect = '16:9',
  loop = false,
  duration = '5s', // Luma duration: 5s or 9s for ray-2
  resolution = '1080p', // Luma resolution: 720p or 1080p
  keyframes,
  // Advanced Luma parameters
  cameraMovement,
  cameraAngle,
  cameraDistance,
  style,
  lighting,
  mood,
  motionIntensity,
  motionSpeed,
  subjectMovement,
  quality,
  colorGrading,
  filmLook,
  seed,
  negativePrompt,
  guidanceScale,
}) {
  if (!LUMA_API_KEY) {
    throw new Error('luma_not_configured')
  }

  if (!LUMA_VIDEO_MODELS.has(model)) {
    throw Object.assign(new Error('luma_model_not_supported'), {
      statusCode: 400,
      details: { model },
    })
  }

  console.log('[Luma] Generating video:', {
    model,
    aspect,
    loop,
    duration,
    resolution,
    promptLength: promptText.length,
    hasImage: !!promptImage,
    hasKeyframes: !!keyframes,
    cameraMovement,
    style,
    lighting,
    mood,
    motionIntensity,
    quality,
    seed,
    guidanceScale,
  })

  const payload = {
    model: model,
    prompt: promptText.trim(),
    aspect_ratio: aspect,
    loop: Boolean(loop),
    duration: duration,
    resolution: resolution,
  }

  // Add advanced parameters if provided
  if (cameraMovement) payload.camera_movement = cameraMovement;
  if (cameraAngle) payload.camera_angle = cameraAngle;
  if (cameraDistance) payload.camera_distance = cameraDistance;
  if (style) payload.style = style;
  if (lighting) payload.lighting = lighting;
  if (mood) payload.mood = mood;
  if (motionIntensity) payload.motion_intensity = motionIntensity;
  if (motionSpeed) payload.motion_speed = motionSpeed;
  if (subjectMovement) payload.subject_movement = subjectMovement;
  if (quality) payload.quality = quality;
  if (colorGrading) payload.color_grading = colorGrading;
  if (filmLook) payload.film_look = filmLook;
  if (seed) payload.seed = seed;
  if (negativePrompt) payload.negative_prompt = negativePrompt;
  if (guidanceScale) payload.guidance_scale = guidanceScale;

  // Add keyframes if provided
  if (keyframes) {
    if (keyframes.frame0) {
      payload.keyframes = payload.keyframes || {}
      payload.keyframes.frame0 = keyframes.frame0
    }
    if (keyframes.frame1) {
      payload.keyframes = payload.keyframes || {}
      payload.keyframes.frame1 = keyframes.frame1
    }
  }

  // If promptImage is provided and no keyframes, use it as frame0
  if (promptImage && !keyframes) {
    payload.keyframes = {
      frame0: {
        type: 'image',
        url: promptImage, // Assuming it's a URL or base64
      },
    }
  }

  try {
    const response = await fetch('https://api.lumalabs.ai/dream-machine/v1/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LUMA_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Luma] API Error:', response.status, errorText)
      const error = new Error(`Luma API error: ${response.status}`)
      error.statusCode = response.status
      error.raw = errorText
      throw error
    }

    const result = await response.json()
    console.log('[Luma] Generation created:', result.id)

    return {
      taskId: result.id,
      status: result.state || 'pending',
    }
  } catch (error) {
    console.error('[Luma] Generation failed:', error)
    throw error
  }
}

async function pollLumaTask(taskId) {
  if (!LUMA_API_KEY) {
    throw new Error('luma_not_configured')
  }

  try {
    const response = await fetch(`https://api.lumalabs.ai/dream-machine/v1/generations/${taskId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LUMA_API_KEY}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Luma] Poll Error:', response.status, errorText)
      throw new Error(`Luma poll error: ${response.status}`)
    }

    const result = await response.json()
    console.log('[Luma] Task status:', result.id, result.state)

    // Map Luma states to Runway-like states for consistency
    const statusMap = {
      'pending': 'PENDING',
      'dreaming': 'RUNNING',
      'completed': 'SUCCEEDED',
      'failed': 'FAILED',
    }

    return {
      taskId: result.id,
      status: statusMap[result.state] || result.state.toUpperCase(),
      progress: result.state === 'dreaming' ? 50 : result.state === 'completed' ? 100 : 0,
      videoUrl: result.state === 'completed' && result.assets?.video ? result.assets.video : undefined,
      createdAt: result.created_at,
      error: result.failure_reason || undefined,
    }
  } catch (error) {
    console.error('[Luma] Poll failed:', error)
    throw error
  }
}

const videoTasks = new Map()

app.post('/v1/videos/generate', async (req, res) => {
  const {
    provider = 'runway', // Provider selection: 'runway' or 'luma'
    promptText,
    promptImage, // Base64 image for image-to-video
    model,
    duration = 8,
    aspect = '9:16',
    watermark = false,
    seed,
    // Luma-specific
    loop = false,
    lumaDuration = '5s',
    lumaResolution = '1080p',
    keyframes,
    // Advanced Luma parameters
    lumaCameraMovement,
    lumaCameraAngle,
    lumaCameraDistance,
    lumaStyle,
    lumaLighting,
    lumaMood,
    lumaMotionIntensity,
    lumaMotionSpeed,
    lumaSubjectMovement,
    lumaQuality,
    lumaColorGrading,
    lumaFilmLook,
    lumaSeed,
    lumaNegativePrompt,
    lumaGuidanceScale,
  } = req.body

  if (!promptText || typeof promptText !== 'string' || promptText.trim().length === 0) {
    return res.status(400).json({ error: 'promptText is required' })
  }

  // Route to appropriate provider
  if (provider === 'luma') {
    // ═════════════════════════════════════════════════════════════════════
    // LUMA VIDEO GENERATION
    // ═════════════════════════════════════════════════════════════════════
    if (!LUMA_API_KEY) {
      return res.status(503).json({
        error: 'luma_not_configured',
        message: 'Luma API key is not configured',
      })
    }

    try {
      const { taskId, status } = await generateLumaVideo({
        promptText,
        promptImage,
        model: model || 'ray-2',
        aspect,
        loop,
        duration: lumaDuration,
        resolution: lumaResolution,
        keyframes,
        // Advanced Luma parameters
        cameraMovement: lumaCameraMovement,
        cameraAngle: lumaCameraAngle,
        cameraDistance: lumaCameraDistance,
        style: lumaStyle,
        lighting: lumaLighting,
        mood: lumaMood,
        motionIntensity: lumaMotionIntensity,
        motionSpeed: lumaMotionSpeed,
        subjectMovement: lumaSubjectMovement,
        quality: lumaQuality,
        colorGrading: lumaColorGrading,
        filmLook: lumaFilmLook,
        seed: lumaSeed,
        negativePrompt: lumaNegativePrompt,
        guidanceScale: lumaGuidanceScale,
      })

      videoTasks.set(taskId, {
        taskId,
        status,
        provider: 'luma',
        createdAt: Date.now(),
        promptText,
        model: model || 'ray-2',
        aspect,
        loop,
        duration: lumaDuration,
        userId: req.userId || 'anonymous',
      })

      res.json({
        taskId,
        status,
        provider: 'luma',
        message: 'Luma video generation started',
      })
    } catch (error) {
      console.error('[Luma] Generation endpoint error:', error)
      const status = error.statusCode && Number.isInteger(error.statusCode)
        ? error.statusCode
        : 500

      let lumaError
      if (error.raw) {
        try {
          lumaError = JSON.parse(error.raw)
        } catch {
          lumaError = { raw: error.raw }
        }
      }

      res.status(status).json({
        error: status === 403 ? 'luma_model_forbidden' : status === 400 ? 'luma_model_invalid' : 'generation_failed',
        message: error.message,
        provider: 'luma',
        ...(lumaError ? { luma: lumaError } : {}),
      })
    }
  } else {
    // ═════════════════════════════════════════════════════════════════════
    // RUNWAY VIDEO GENERATION (default)
    // ═════════════════════════════════════════════════════════════════════
    if (!RUNWAY_API_KEY) {
      return res.status(503).json({
        error: 'runway_not_configured',
        message: 'Runway API key is not configured',
      })
    }

    // Runway Gen-3 supported ratios (from API documentation)
    const aspectToRatio = {
      '16:9': '1280:720',   // Landscape widescreen
      '9:16': '720:1280',   // Portrait mobile
      '1:1': '960:960',     // Square
    }
    const ratio = aspectToRatio[aspect] || '1280:720'

    try {
      const { taskId, status } = await generateRunwayVideo({
        promptText,
        promptImage,
        model: model || 'veo3',
        duration,
        ratio,
        watermark,
        seed,
      })

      videoTasks.set(taskId, {
        taskId,
        status,
        provider: 'runway',
        createdAt: Date.now(),
        promptText,
        model: model || 'veo3',
        duration,
        aspect,
        userId: req.userId || 'anonymous',
      })

      res.json({
        taskId,
        status,
        provider: 'runway',
        message: 'Runway video generation started',
      })
    } catch (error) {
      console.error('[Runway] Generation endpoint error:', error)
      const status = error.statusCode && Number.isInteger(error.statusCode)
        ? error.statusCode
        : 500

      let runwayError
      if (error.raw) {
        try {
          runwayError = JSON.parse(error.raw)
        } catch {
          runwayError = { raw: error.raw }
        }
      }

      res.status(status).json({
        error: status === 403 ? 'runway_model_forbidden' : status === 400 ? 'runway_model_invalid' : 'generation_failed',
        message: error.message,
        provider: 'runway',
        ...(runwayError ? { runway: runwayError } : {}),
      })
    }
  }
})

app.get('/v1/videos/tasks/:taskId', async (req, res) => {
  const { taskId } = req.params
  const { provider = 'runway' } = req.query

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' })
  }

  // Determine provider from stored task or query param
  const stored = videoTasks.get(taskId)
  const actualProvider = stored?.provider || provider

  if (actualProvider === 'luma') {
    // ═════════════════════════════════════════════════════════════════════
    // LUMA TASK POLLING
    // ═════════════════════════════════════════════════════════════════════
    if (!LUMA_API_KEY) {
      return res.status(503).json({
        error: 'luma_not_configured',
        message: 'Luma API key is not configured',
      })
    }

    try {
      const result = await pollLumaTask(taskId)

      if (stored) {
        videoTasks.set(taskId, {
          ...stored,
          status: result.status,
          updatedAt: Date.now(),
        })
      }

      const response = {
        taskId: result.taskId,
        status: result.status,
        progress: result.progress || 0,
        provider: 'luma',
      }

      if (result.status === 'SUCCEEDED' && result.videoUrl) {
        response.videoUrl = result.videoUrl
        response.createdAt = result.createdAt
        
        // Track successful video generation (Luma)
        const durationMap = { '5s': 5, '9s': 9, '13s': 13 }
        const videoSeconds = durationMap[stored?.duration || lumaDuration] || 5
        const totalCost = usageTracker.calculateVideoCost('luma', videoSeconds)
        
        await usageTracker.trackAPIUsage({
          userId: req.userId || stored?.userId || 'anonymous',
          serviceType: 'video',
          provider: 'luma',
          model: stored?.model || 'ray-2',
          endpoint: '/v1/videos/generate',
          requestId: taskId,
          videoSeconds,
          generationCost: totalCost,
          totalCost,
          latency: stored?.createdAt ? (Date.now() - stored.createdAt) : 0,
          status: 'success',
          ipAddress: req.ipAddress,
          userAgent: req.userAgent
        }).catch(err => console.error('[Tracking] Failed to track video:', err))
      }

      if (result.status === 'FAILED' && result.error) {
        response.error = result.error
        
        // Track failed video generation (Luma)
        await usageTracker.trackAPIUsage({
          userId: req.userId || stored?.userId || 'anonymous',
          serviceType: 'video',
          provider: 'luma',
          model: stored?.model || 'ray-2',
          endpoint: '/v1/videos/generate',
          requestId: taskId,
          totalCost: 0,
          latency: stored?.createdAt ? (Date.now() - stored.createdAt) : 0,
          status: 'error',
          errorMessage: result.error,
          ipAddress: req.ipAddress,
          userAgent: req.userAgent
        }).catch(err => console.error('[Tracking] Failed to track error:', err))
      }

      res.json(response)
    } catch (error) {
      console.error('[Luma] Poll endpoint error:', error)
      res.status(500).json({
        error: 'poll_failed',
        message: error.message,
        provider: 'luma',
      })
    }
  } else {
    // ═════════════════════════════════════════════════════════════════════
    // RUNWAY TASK POLLING (default)
    // ═════════════════════════════════════════════════════════════════════
    if (!RUNWAY_API_KEY) {
      return res.status(503).json({
        error: 'runway_not_configured',
        message: 'Runway API key is not configured',
      })
    }

    try {
      const result = await pollRunwayTask(taskId)

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
        provider: 'runway',
      }

      if (result.status === 'SUCCEEDED' && result.output) {
        response.videoUrl = result.output[0]
        response.createdAt = result.createdAt
        
        // Track successful video generation (Runway)
        const videoSeconds = stored?.duration || 8
        const totalCost = usageTracker.calculateVideoCost('runway', videoSeconds)
        
        await usageTracker.trackAPIUsage({
          userId: req.userId || stored?.userId || 'anonymous',
          serviceType: 'video',
          provider: 'runway',
          model: stored?.model || 'veo3',
          endpoint: '/v1/videos/generate',
          requestId: taskId,
          videoSeconds,
          generationCost: totalCost,
          totalCost,
          latency: stored?.createdAt ? (Date.now() - stored.createdAt) : 0,
          status: 'success',
          ipAddress: req.ipAddress,
          userAgent: req.userAgent
        }).catch(err => console.error('[Tracking] Failed to track video:', err))
      }

      if (result.status === 'FAILED' && result.failure) {
        response.error = result.failure
        response.failureCode = result.failureCode
        
        // Track failed video generation (Runway)
        await usageTracker.trackAPIUsage({
          userId: req.userId || stored?.userId || 'anonymous',
          serviceType: 'video',
          provider: 'runway',
          model: stored?.model || 'veo3',
          endpoint: '/v1/videos/generate',
          requestId: taskId,
          totalCost: 0,
          latency: stored?.createdAt ? (Date.now() - stored.createdAt) : 0,
          status: 'error',
          errorMessage: result.failure,
          ipAddress: req.ipAddress,
          userAgent: req.userAgent
        }).catch(err => console.error('[Tracking] Failed to track error:', err))
      }

      res.json(response)
    } catch (error) {
      console.error('[Runway] Poll endpoint error:', error)
      res.status(500).json({
        error: 'poll_failed',
        message: error.message,
        provider: 'runway',
      })
    }
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
      luma: !!LUMA_API_KEY,
    },
  })
})

// Multi-provider image generation endpoint
app.post('/v1/images/generate', async (req, res) => {
  const startTime = Date.now()
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

    // Track successful image generation
    const imageCount = assets.length
    const quality = provider === 'openai' ? dalleQuality : (fluxMode === 'ultra' ? 'ultra' : 'standard')
    const totalCost = usageTracker.calculateImageCost(provider, quality, imageCount)
    
    await usageTracker.trackAPIUsage({
      userId: req.userId || 'anonymous',
      serviceType: 'images',
      provider,
      model: provider === 'openai' ? 'dall-e-3' : (provider === 'ideogram' ? ideogramModel : provider),
      endpoint: '/v1/images/generate',
      imagesGenerated: imageCount,
      generationCost: totalCost,
      totalCost,
      latency: Date.now() - startTime,
      status: 'success',
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    }).catch(err => console.error('[Tracking] Failed to track image generation:', err))

  } catch (error) {
    console.error(`[images] ${provider} generation failed`, error)
    
    // Track failed image generation
    await usageTracker.trackAPIUsage({
      userId: req.userId || 'anonymous',
      serviceType: 'images',
      provider,
      model: provider,
      endpoint: '/v1/images/generate',
      totalCost: 0,
      latency: Date.now() - startTime,
      status: 'error',
      errorMessage: error.message,
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    }).catch(err => console.error('[Tracking] Failed to track error:', err))
    
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

function sanitizeAttachmentPreview(attachment, index) {
  if (!attachment || typeof attachment !== 'object') return null

  const name = typeof attachment.name === 'string' && attachment.name.trim() ? attachment.name.trim() : `Attachment ${index + 1}`
  const mime = typeof attachment.mime === 'string' && attachment.mime.trim() ? attachment.mime.trim() : 'application/octet-stream'
  const lines = [`Attachment ${index + 1}: ${name}`, `MIME Type: ${mime}`]

  const data = typeof attachment.data === 'string' ? attachment.data.trim() : ''
  if (!data) {
    lines.push('No attachment data provided.')
    return lines.join('\n')
  }

  const isTextLike = /^text\//i.test(mime) || /json$/i.test(mime) || /markdown$/i.test(mime) || /csv$/i.test(mime) || /xml$/i.test(mime)

  if (isTextLike) {
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf8')
      const snippet = decoded.slice(0, 4000)
      lines.push('Content Preview:')
      lines.push(snippet + (decoded.length > snippet.length ? '\n… [truncated]' : ''))
      return lines.join('\n')
    } catch (error) {
      lines.push('Content could not be decoded from base64.')
      return lines.join('\n')
    }
  }

  lines.push('Binary attachment received. Mention its purpose in the refined brief. Content omitted for brevity.')
  return lines.join('\n')
}

app.post('/v1/tools/brief/refine', async (req, res) => {
  const { brief, attachments = [] } = req.body || {}
  const trimmedBrief = typeof brief === 'string' ? brief.trim() : ''

  if (!trimmedBrief) {
    return res.status(400).json({ error: 'brief_required' })
  }

  if (!openai && !MOCK_OPENAI) {
    return res.status(503).json({ error: 'openai_not_configured' })
  }

  const attachmentSummaries = Array.isArray(attachments)
    ? attachments
        .slice(0, 5)
        .map((attachment, index) => sanitizeAttachmentPreview(attachment, index))
        .filter(Boolean)
    : []

  if (MOCK_OPENAI) {
    const mockBrief = `Refined Brief (mock): ${trimmedBrief}`
    return res.json({ brief: mockBrief, model: 'mock-openai', mock: true })
  }

  const systemPrompt = [
    'You are a senior marketing strategist and copy chief at SINAIQ.',
    'Rewrite and elevate client briefs so they are polished, actionable, and ready for downstream AI generation.',
    'Preserve all key facts, offers, audiences, and constraints from the source brief and attachments.',
    'Clarify vague language, ensure tone guidance is explicit, and structure the brief with concise sections.',
    'Keep the output under 250 words unless crucial details require more.',
    'Respond with plain text only — no JSON or markdown lists.',
  ].join('\n')

  const userSections = ['--- ORIGINAL BRIEF ---', trimmedBrief]

  if (attachmentSummaries.length) {
    userSections.push('--- ATTACHMENT NOTES ---')
    userSections.push(attachmentSummaries.join('\n\n'))
  }

  userSections.push('--- TASK ---')
  userSections.push(
    [
      'Refine the brief so it is immediately useful for generating multi-platform marketing content.',
      'Include persona, tone, CTA, product highlights, goals, and any strategic guardrails explicitly.',
      'If information is missing, note assumptions clearly but do not invent facts.',
    ].join(' ')
  )

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userSections.join('\n\n') },
  ]

  const callModel = async (modelId) => {
    const params = { model: modelId, messages }

    if (modelId.startsWith('gpt-5')) {
      params.max_completion_tokens = 600
    } else {
      params.max_tokens = 600
      params.temperature = 0.35
    }

    const response = await openai.chat.completions.create(params)
    const content = response.choices?.[0]?.message?.content?.trim() || ''
    return { content }
  }

  let refined = ''
  let usedModel = OPENAI_PRIMARY_MODEL

  try {
    const primary = await callModel(OPENAI_PRIMARY_MODEL)
    refined = primary.content
  } catch (error) {
    console.error('[brief/refine] primary model failed', error)
  }

  if (!refined && OPENAI_FALLBACK_MODEL && OPENAI_FALLBACK_MODEL !== OPENAI_PRIMARY_MODEL) {
    try {
      const fallback = await callModel(OPENAI_FALLBACK_MODEL)
      refined = fallback.content
      usedModel = OPENAI_FALLBACK_MODEL
    } catch (error) {
      console.error('[brief/refine] fallback model failed', error)
    }
  }

  if (!refined) {
    return res.status(500).json({ error: 'refine_failed' })
  }

  res.json({ brief: refined, model: usedModel })
})

// ═══════════════════════════════════════════════════════════════════════════════
// VIDEO PROMPT ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/v1/tools/video/enhance', async (req, res) => {
  const { prompt, provider = 'runway', settings = {}, brief } = req.body
  const trimmedPrompt = typeof prompt === 'string' ? prompt.trim() : ''

  if (!trimmedPrompt) {
    return res.status(400).json({ error: 'prompt_required' })
  }

  if (!openai && !MOCK_OPENAI) {
    return res.status(503).json({ error: 'openai_not_configured' })
  }

  if (MOCK_OPENAI) {
    const mockEnhanced = `Enhanced video prompt (mock): ${trimmedPrompt} with cinematic lighting and smooth camera movement`
    return res.json({ enhanced: mockEnhanced, model: 'mock-openai', mock: true })
  }

  const providerInfo = provider === 'luma' 
    ? {
        name: 'Luma Dream Machine (Ray-2)',
        capabilities: 'Fast generation, creative interpretation, seamless loops, text-to-video',
        strengths: 'Quick results, artistic style, perfect for social media content',
      }
    : {
        name: 'Runway (Veo-3)',
        capabilities: 'Cinema-quality output, advanced camera controls, photorealistic rendering',
        strengths: 'Highest quality, professional cinematography, detailed control',
      }

  const settingsContext = []
  if (settings.aspect) settingsContext.push(`Aspect ratio: ${settings.aspect}`)
  if (settings.cameraMovement && settings.cameraMovement !== 'static') {
    settingsContext.push(`Camera movement: ${settings.cameraMovement}`)
  }
  if (settings.visualStyle) settingsContext.push(`Visual style: ${settings.visualStyle}`)
  if (settings.lightingStyle) settingsContext.push(`Lighting: ${settings.lightingStyle}`)
  if (settings.mood) settingsContext.push(`Mood: ${settings.mood}`)
  if (settings.colorGrading) settingsContext.push(`Color grading: ${settings.colorGrading}`)

  const systemPrompt = [
    `You are a professional cinematographer and video director with expertise in AI video generation.`,
    `You're helping create prompts for ${providerInfo.name}.`,
    '',
    `Provider Capabilities:`,
    `- ${providerInfo.capabilities}`,
    `- ${providerInfo.strengths}`,
    '',
    `Your task:`,
    `1. Enhance the user's video idea into a detailed, professional prompt`,
    `2. Incorporate cinematography terminology (framing, movement, lighting)`,
    `3. Be specific about subject, action, setting, and atmosphere`,
    `4. Optimize for ${provider === 'luma' ? 'fast creative generation' : 'cinema-quality output'}`,
    `5. Keep prompts between 50-200 words`,
    `6. Use vivid, descriptive language`,
    `7. Consider the selected settings: ${settingsContext.join(', ') || 'none specified'}`,
    '',
    `Response format: Return ONLY the enhanced prompt text, no explanations.`,
  ].join('\n')

  const userSections = [
    `--- USER'S VIDEO IDEA ---`,
    trimmedPrompt,
  ]

  if (brief && brief.trim()) {
    userSections.push('')
    userSections.push(`--- CAMPAIGN CONTEXT ---`)
    userSections.push(brief.trim())
  }

  if (settingsContext.length > 0) {
    userSections.push('')
    userSections.push(`--- SELECTED SETTINGS ---`)
    userSections.push(settingsContext.join('\n'))
  }

  userSections.push('')
  userSections.push(`--- TASK ---`)
  userSections.push(
    `Transform the video idea above into a professional, detailed prompt that will generate stunning ${provider === 'luma' ? 'creative' : 'cinematic'} video content. ` +
    `Focus on visual details, movement, composition, and atmosphere.`
  )

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userSections.join('\n') },
  ]

  const callModel = async (modelId) => {
    const params = { model: modelId, messages }

    if (modelId.startsWith('gpt-5')) {
      params.max_completion_tokens = 500
    } else {
      params.max_tokens = 500
      params.temperature = 0.65
    }

    const response = await openai.chat.completions.create(params)
    const content = response.choices?.[0]?.message?.content?.trim() || ''
    return { content }
  }

  let enhanced = ''
  let usedModel = OPENAI_PRIMARY_MODEL

  try {
    const primary = await callModel(OPENAI_PRIMARY_MODEL)
    enhanced = primary.content
  } catch (error) {
    console.error('[video/enhance] primary model failed', error)
  }

  if (!enhanced && OPENAI_FALLBACK_MODEL && OPENAI_FALLBACK_MODEL !== OPENAI_PRIMARY_MODEL) {
    try {
      const fallback = await callModel(OPENAI_FALLBACK_MODEL)
      enhanced = fallback.content
      usedModel = OPENAI_FALLBACK_MODEL
    } catch (error) {
      console.error('[video/enhance] fallback model failed', error)
    }
  }

  if (!enhanced) {
    return res.status(500).json({ error: 'enhance_failed' })
  }

  res.json({ enhanced, model: usedModel, provider })
})

// ═══════════════════════════════════════════════════════════════════════════════
// PICTURES PROMPT ENHANCEMENT
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/v1/tools/pictures/suggest', async (req, res) => {
  const { settings = {}, brief, provider = 'openai' } = req.body

  if (!openai && !MOCK_OPENAI) {
    return res.status(503).json({ error: 'openai_not_configured' })
  }

  if (MOCK_OPENAI) {
    const mockSuggestion = `Professional product photography with ${settings.style || 'modern'} style, ${settings.lighting || 'natural'} lighting`
    return res.json({ suggestion: mockSuggestion, model: 'mock-openai', mock: true })
  }

  const providerInfo = {
    openai: { name: 'DALL·E 3', strengths: 'Fast, vivid colors, great for illustrations' },
    flux: { name: 'FLUX Pro', strengths: 'Photorealistic, human faces, professional photography' },
    stability: { name: 'Stability AI SD 3.5', strengths: 'Fine control via CFG, creative freedom' },
    ideogram: { name: 'Ideogram', strengths: 'Typography, text in images, brand assets' },
  }[provider] || { name: provider, strengths: 'General purpose image generation' }

  const settingsContext = []
  if (settings.style) settingsContext.push(`Style: ${settings.style}`)
  if (settings.aspect) settingsContext.push(`Aspect ratio: ${settings.aspect}`)
  if (settings.lighting) settingsContext.push(`Lighting: ${settings.lighting}`)
  if (settings.composition) settingsContext.push(`Composition: ${settings.composition}`)
  if (settings.camera) settingsContext.push(`Camera angle: ${settings.camera}`)
  if (settings.mood) settingsContext.push(`Mood: ${settings.mood}`)
  if (settings.backdrop) settingsContext.push(`Backdrop: ${settings.backdrop}`)

  const systemPrompt = [
    `You are a professional art director and image prompt engineer.`,
    `You're creating prompts for ${providerInfo.name}.`,
    '',
    `Provider Strengths: ${providerInfo.strengths}`,
    '',
    `Your task:`,
    `1. Create a detailed, descriptive image prompt optimized for ${provider}`,
    `2. Focus on visual composition, lighting, colors, and mood`,
    `3. Be specific about the subject, setting, and atmosphere`,
    `4. Use professional photography/art terminology`,
    `5. Keep prompts between 40-150 words`,
    `6. Make it vivid and evocative`,
    `7. Consider the selected settings: ${settingsContext.join(', ') || 'none specified'}`,
    '',
    `Response format: Return ONLY the prompt text, no explanations.`,
  ].join('\n')

  const userSections = []

  if (brief && brief.trim()) {
    userSections.push(`--- CAMPAIGN CONTEXT ---`)
    userSections.push(brief.trim())
    userSections.push('')
  }

  if (settingsContext.length > 0) {
    userSections.push(`--- SELECTED SETTINGS ---`)
    userSections.push(settingsContext.join('\n'))
    userSections.push('')
  }

  userSections.push(`--- TASK ---`)
  userSections.push(
    `Create a compelling image prompt that will generate stunning visual content for this marketing campaign. ` +
    `Focus on composition, lighting, mood, and brand alignment.`
  )

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userSections.join('\n') },
  ]

  const callModel = async (modelId) => {
    const params = { model: modelId, messages }

    if (modelId.startsWith('gpt-5')) {
      params.max_completion_tokens = 400
    } else {
      params.max_tokens = 400
      params.temperature = 0.75
    }

    const response = await openai.chat.completions.create(params)
    const content = response.choices?.[0]?.message?.content?.trim() || ''
    return { content }
  }

  let suggestion = ''
  let usedModel = OPENAI_PRIMARY_MODEL

  try {
    const primary = await callModel(OPENAI_PRIMARY_MODEL)
    suggestion = primary.content
  } catch (error) {
    console.error('[pictures/suggest] primary model failed', error)
  }

  if (!suggestion && OPENAI_FALLBACK_MODEL && OPENAI_FALLBACK_MODEL !== OPENAI_PRIMARY_MODEL) {
    try {
      const fallback = await callModel(OPENAI_FALLBACK_MODEL)
      suggestion = fallback.content
      usedModel = OPENAI_FALLBACK_MODEL
    } catch (error) {
      console.error('[pictures/suggest] fallback model failed', error)
    }
  }

  if (!suggestion) {
    return res.status(500).json({ error: 'suggest_failed' })
  }

  res.json({ suggestion, model: usedModel, provider })
})

app.post('/v1/generate', async (req, res) => {
  if (!req.body?.brief || !req.body?.options) {
    return res.status(400).json({ error: 'missing brief/options' })
  }
  const runId = id()
  const trackingContext = {
    userId: req.userId || 'anonymous',
    ipAddress: req.ipAddress,
    userAgent: req.userAgent,
    startTime: Date.now()
  }
  update(runId, 'queued', null, null)
  res.json({ runId })
  setTimeout(() => processRun(runId, req.body, trackingContext).catch(() => {}), 20)
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
  const { message, history = [], attachments = [] } = req.body
  const startTime = Date.now()

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message required' })
  }

  if (!openai) {
    return res.status(503).json({ error: 'OpenAI not configured' })
  }

  if (!isBaduTopic(message)) {
    return res.json({ reply: BADU_KNOWLEDGE.guardrails.fallbackOutsideScope })
  }

  try {
    const safeHistory = Array.isArray(history) ? history : []
    const safeAttachments = Array.isArray(attachments) ? attachments : []

    let contextMessage = message.trim()
    const hasImages = safeAttachments.some((att) => att?.type && att.type.startsWith('image/'))

    if (safeAttachments.length > 0 && !hasImages) {
      const fileList = safeAttachments.map((file) => file?.name).filter(Boolean).join(', ')
      if (fileList) {
        contextMessage = `${contextMessage}\n\n[User attached ${safeAttachments.length} file(s): ${fileList}]`
      }
    }

    const messages = buildBaduMessages({
      contextMessage,
      history: safeHistory,
      attachments: safeAttachments,
      includeCoT: false,
    })

    const lowerContext = contextMessage.toLowerCase()
    const complexTriggers = [
      'explain',
      'how to',
      'walk me through',
      'detail',
      'example',
      'guide',
      'all',
      'full',
      'complete',
      'comprehensive',
      'settings',
      'options',
      'parameters',
      'compare',
    ]
    const messageWords = contextMessage.split(/\s+/).filter(Boolean).length
    const isComplexRequest =
      messageWords > 30 || complexTriggers.some((trigger) => lowerContext.includes(trigger))

    const maxTokens = isComplexRequest ? 2500 : 800
    const modelToUse = hasImages ? 'gpt-4o' : OPENAI_CHAT_MODEL

    const completionParams = {
      model: modelToUse,
      messages,
    }

    if (modelToUse.startsWith('gpt-5')) {
      completionParams.max_completion_tokens = maxTokens
    } else {
      completionParams.max_tokens = maxTokens
      completionParams.temperature = 0.65
    }

    const completion = await openai.chat.completions.create(completionParams)
    const choice = completion.choices?.[0]
    let reply = choice?.message?.content || ''

    if (choice?.finish_reason === 'length') {
      const continuation = await fetchContinuation({
        messages,
        model: modelToUse,
        partial: reply,
        temperature: 0.65,
      })
      reply += continuation
    }

    reply = ensurePolishedEnding(reply)
    const sanitized = sanitizeBaduReply(reply)

    const payload = { reply: sanitized.content }
    if (sanitized.flagged) {
      payload.guard = { triggered: true, reason: sanitized.reason }
    }

    res.json(payload)

    // Track successful chat
    const inputTokens = usageTracker.estimateTokens(contextMessage) + (safeHistory.length * 50)
    const outputTokens = usageTracker.estimateTokens(reply)
    const costs = usageTracker.calculateOpenAICost(inputTokens, outputTokens, modelToUse)
    
    await usageTracker.trackAPIUsage({
      userId: req.userId || 'anonymous',
      serviceType: 'chat',
      provider: 'openai',
      model: modelToUse,
      endpoint: '/v1/chat',
      inputTokens,
      outputTokens,
      inputCost: costs.inputCost,
      outputCost: costs.outputCost,
      totalCost: costs.totalCost,
      latency: Date.now() - startTime,
      status: 'success',
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    }).catch(err => console.error('[Tracking] Failed to track chat:', err))

  } catch (error) {
    console.error('[Badu] API Error:', error)
    
    // Track failed chat
    await usageTracker.trackAPIUsage({
      userId: req.userId || 'anonymous',
      serviceType: 'chat',
      provider: 'openai',
      model: 'unknown',
      endpoint: '/v1/chat',
      totalCost: 0,
      latency: Date.now() - startTime,
      status: 'error',
      errorMessage: error.message,
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    }).catch(err => console.error('[Tracking] Failed to track error:', err))
    
    res.status(500).json({ error: 'Failed to generate response' })
  }
})



app.post('/v1/chat/stream', async (req, res) => {
  const { message, history = [], attachments = [] } = req.body
  const startTime = Date.now()

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' })
  }

  if (!openai) {
    return res.status(500).json({ error: 'OpenAI not configured' })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  if (!isBaduTopic(message)) {
    sendSSEReply(res, BADU_KNOWLEDGE.guardrails.fallbackOutsideScope)
    return
  }

  try {
    const safeHistory = Array.isArray(history) ? history : []
    const safeAttachments = Array.isArray(attachments) ? attachments : []

    let contextMessage = message.trim()
    const hasImages = safeAttachments.some((att) => att?.type && att.type.startsWith('image/'))

    if (safeAttachments.length > 0 && !hasImages) {
      const fileList = safeAttachments.map((file) => file?.name).filter(Boolean).join(', ')
      if (fileList) {
        contextMessage = `${contextMessage}\n\n[User attached ${safeAttachments.length} file(s): ${fileList}]`
      }
    }

    const messages = buildBaduMessages({
      contextMessage,
      history: safeHistory,
      attachments: safeAttachments,
      includeCoT: true,
    })

    const lowerContext = contextMessage.toLowerCase()
    const complexTriggers = [
      'explain',
      'how to',
      'walk me through',
      'detail',
      'example',
      'guide',
      'all',
      'full',
      'complete',
      'comprehensive',
      'settings',
      'options',
      'parameters',
      'compare',
    ]
    const messageWords = contextMessage.split(/\s+/).filter(Boolean).length
    const isComplexRequest =
      messageWords > 30 || complexTriggers.some((trigger) => lowerContext.includes(trigger))

    const maxTokens = isComplexRequest ? 2500 : 800
    const modelToUse = hasImages ? 'gpt-4o' : OPENAI_CHAT_MODEL

    const completionParams = {
      model: modelToUse,
      messages,
      stream: true,
    }

    if (modelToUse.startsWith('gpt-5')) {
      completionParams.max_completion_tokens = maxTokens
    } else {
      completionParams.max_tokens = maxTokens
      completionParams.temperature = 0.65
    }

    const stream = await openai.chat.completions.create(completionParams)
    let aggregated = ''
    let finishReason = null

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0]
      if (!choice) continue
      finishReason = choice.finish_reason ?? finishReason
      const token = choice.delta?.content || ''
      if (token) {
        aggregated += token
      }
    }

    if (finishReason === 'length') {
      const continuation = await fetchContinuation({
        messages,
        model: modelToUse,
        partial: aggregated,
        temperature: 0.65,
      })
      aggregated += continuation
    }

    aggregated = ensurePolishedEnding(aggregated)
    const sanitized = sanitizeBaduReply(aggregated)
    if (sanitized.flagged) {
      console.warn('[Badu Stream] Guardrail triggered:', sanitized.reason)
    }

    sendSSEReply(res, sanitized.content)

    // Track successful streaming chat
    const inputTokens = usageTracker.estimateTokens(contextMessage) + (safeHistory.length * 50)
    const outputTokens = usageTracker.estimateTokens(aggregated)
    const costs = usageTracker.calculateOpenAICost(inputTokens, outputTokens, modelToUse)
    
    await usageTracker.trackAPIUsage({
      userId: req.userId || 'anonymous',
      serviceType: 'chat',
      provider: 'openai',
      model: modelToUse,
      endpoint: '/v1/chat/stream',
      inputTokens,
      outputTokens,
      inputCost: costs.inputCost,
      outputCost: costs.outputCost,
      totalCost: costs.totalCost,
      latency: Date.now() - startTime,
      status: 'success',
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    }).catch(err => console.error('[Tracking] Failed to track stream chat:', err))

  } catch (error) {
    console.error('[Badu Stream] Error:', error)
    
    // Track failed streaming chat
    await usageTracker.trackAPIUsage({
      userId: req.userId || 'anonymous',
      serviceType: 'chat',
      provider: 'openai',
      model: 'unknown',
      endpoint: '/v1/chat/stream',
      totalCost: 0,
      latency: Date.now() - startTime,
      status: 'error',
      errorMessage: error.message,
      ipAddress: req.ipAddress,
      userAgent: req.userAgent
    }).catch(err => console.error('[Tracking] Failed to track error:', err))
    
    res.write(`data: ${JSON.stringify({ error: BADU_KNOWLEDGE.guardrails.uncertaintyMessage })}\n\n`)
    res.end()
  }
})

app.get('/events', eventsHandler)
app.get('/ai/events', eventsHandler)

async function processRun(runId, data, trackingContext = {}) {
  update(runId, 'thinking')

  if (!openai && !MOCK_OPENAI) {
    update(runId, 'error', null, 'openai_not_configured')
    return
  }

  // Track start
  const startTime = trackingContext.startTime || Date.now()

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

    // Track successful content generation
    const latency = Date.now() - startTime
    const modelUsed = finalMeta.model || OPENAI_PRIMARY_MODEL
    const estimatedInputTokens = Math.ceil((data.brief || '').length / 4) + 500 // Rough estimate
    const estimatedOutputTokens = finalVariants.length * 150 // ~150 tokens per variant
    const costs = usageTracker.calculateOpenAICost(estimatedInputTokens, estimatedOutputTokens, modelUsed.split(',')[0])
    
    await usageTracker.trackAPIUsage({
      userId: trackingContext.userId || 'anonymous',
      serviceType: 'content',
      provider: 'openai',
      model: modelUsed,
      endpoint: '/v1/generate',
      requestId: runId,
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      inputCost: costs.inputCost,
      outputCost: costs.outputCost,
      totalCost: costs.totalCost,
      latency,
      status: 'success',
      ipAddress: trackingContext.ipAddress,
      userAgent: trackingContext.userAgent
    }).catch(err => console.error('[Tracking] Failed to track content generation:', err))

  } catch (error) {
    const status = error?.status || error?.response?.status
    const code = error?.code || error?.response?.data?.error?.code
    const msg = error?.response?.data?.error?.message || error?.message || 'provider_error'
    console.error('[provider_error]', { status, code, msg })
    update(runId, 'error', null, `provider_error: ${code || status || 'unknown'} — ${msg}`)

    // Track failed content generation
    await usageTracker.trackAPIUsage({
      userId: trackingContext.userId || 'anonymous',
      serviceType: 'content',
      provider: 'openai',
      model: 'unknown',
      endpoint: '/v1/generate',
      requestId: runId,
      totalCost: 0,
      latency: Date.now() - startTime,
      status: 'error',
      errorMessage: msg,
      ipAddress: trackingContext.ipAddress,
      userAgent: trackingContext.userAgent
    }).catch(err => console.error('[Tracking] Failed to track error:', err))
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

// Enhanced Badu Chat Endpoint with RAG and Structured JSON
app.post('/v1/chat/enhanced', async (req, res) => {
  const { message, history = [], attachments = [] } = req.body;
  
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message_required' });
  }

  if (!openai) {
    return res.status(503).json({ error: 'openai_not_configured' });
  }

  try {
    // Topic filtering: Check if message is on-topic
    if (!isBaduTopic(message)) {
      return res.json({
        response: {
          title: 'Off-Topic Request',
          message: 'I can only help with questions about the SINAIQ Marketing Engine panels (Content, Pictures, Video) and their settings. Please ask about content creation, image generation, video generation, or panel configurations.',
          type: 'off_topic',
        },
        type: 'error',
      });
    }
    
    // Import enhanced knowledge base
    const { searchCompleteKnowledge, buildCompleteContext } = await import('../shared/badu-kb-complete.js');
    const { detectSchemaType, getSchemaInstruction, validateResponse } = await import('../shared/badu-schemas.js');
    
    // Check if we have images attached (vision mode)
    const hasImages = attachments.some(att => att.type?.startsWith('image/'));
    
    // 1. RAG: Search knowledge base for relevant context (100% accurate from source code)
    // When images attached, limit KB search to avoid irrelevant sources
    const searchLimit = hasImages ? 2 : 5; // Less context when analyzing images
    const searchResults = searchCompleteKnowledge(message, searchLimit);
    const contextChunks = buildCompleteContext(searchResults);
    const sources = searchResults.map(r => r.source);
    
    // 2. Detect appropriate schema type based on query (with image awareness)
    const schemaType = detectSchemaType(message, hasImages);
    const schemaInfo = getSchemaInstruction(schemaType);
    
    // 3. Build system prompt with RAG context and schema enforcement
    const systemPrompt = [
      'You are BADU, the official SINAIQ Marketing Engine copilot with vision capabilities.',
      '',
      '⚠️ YOUR CAPABILITIES:',
      '✅ YES - I CAN analyze images (photos, screenshots, artwork, etc.)',
      '✅ YES - I CAN create detailed prompts from images',
      '✅ YES - I CAN recommend models based on image analysis',
      '✅ YES - I CAN see attachments when provided',
      '❌ NO - I CANNOT analyze video files (only images)',
      '❌ NO - I CANNOT analyze audio files',
      '',
      'Core Rules:',
      '1. Answer ONLY from the provided documentation context',
      '2. ⚠️ WHEN USER ASKS FOR A PROMPT: Always include the full detailed prompt text (300-500 words) in the "Complete Prompt" setting. NEVER skip it.',
      '   - For images: Include full detailed visual description',
      '   - For content: Include full marketing copy example (headline, body, CTA)',
      '   - DO NOT just describe what should be in a prompt - GIVE THE ACTUAL PROMPT',
      '3. MAINTAIN CONTEXT: If you recommended a model (e.g., FLUX Pro) and user asks about "the model" or "settings", they mean THAT model',
      '4. When asked about settings/parameters, provide ACTUAL UI SETTINGS from documentation, not generic descriptions:',
      '   ❌ WRONG: "Style: Photorealistic", "Lighting: Dramatic"',
      '   ✅ RIGHT: "Style Presets: Product, Photographic, Cinematic, etc.", "Aspect Ratio: 1:1, 16:9, 9:16, etc."',
      '5. For image analysis, describe style, composition, lighting, colors, mood, and technical details',
      '6. When creating prompts from images, be extremely detailed and specific (300-500 words minimum)',
      '7. For Luma Ray-2 video, list ALL 15+ parameters: duration, resolution, loop, camera (movement/angle/distance), style, lighting, mood, motion (intensity/speed), subject movement, quality, color grading, film look, technical settings',
      '8. For Content Panel, list ALL 11 settings: Brief, Persona (5 options), Tone (6 options), CTA (7 options), Language (EN/AR/FR), Copy Length (3 options), Platforms (6 channels), Keywords (optional), Hashtags (optional), Avoid (optional), Attachments (max 3 files, 5MB each)',
      '9. Only include "next_steps" if user needs to take action in the app. Omit for purely informational questions.',
      '10. Never invent URLs, prices, or feature claims',
      '11. Use clean, professional formatting',
      '',
      '⚠️ CRITICAL CONTEXT RULE:',
      'If conversation history shows you recommended Model X, and user asks "give me settings for the model",',
      'they mean Model X, NOT a different model. Always check conversation history for context.',
      '',
      '# DOCUMENTATION CONTEXT',
      contextChunks,
      '',
      '# SMART CONTEXT UNDERSTANDING',
      hasImages ? [
        '⚡ CRITICAL: When images are attached, BE SMART ABOUT USER INTENT:',
        '',
        '1. If user says "give me a prompt" → ⚠️ MUST INCLUDE THE FULL DETAILED PROMPT TEXT',
        '   ⚠️ CRITICAL: NEVER skip the prompt - it is MANDATORY',
        '   • Primary content: ONE detailed, comprehensive prompt (300-500 words) in "Complete Prompt" setting',
        '   • Analyze the image DEEPLY: subject, pose, accessories, lighting, materials, textures, colors, mood',
        '   • Write a FULL prompt that captures EVERY visual detail you see',
        '   • The prompt MUST be 300-500 words long with ALL visual details',
        '   • Make it copyable as ONE complete block',
        '   • Secondary: Brief model recommendation',
        '   • Then: basic_settings (provider-specific settings)',
        '   • Then: advanced_settings (Advanced section settings)',
        '   • DO NOT create multiple copy buttons for every setting',
        '   • DO NOT give generic titles - give the ACTUAL DETAILED PROMPT',
        '',
        '2. Structure for prompt + settings requests:',
        '   • "title": Brief title',
        '   • "message": Short intro',
        '   • "panel": "pictures" (if relevant)',
        '   • "settings": [ // ONLY for prompt itself',
        '       {',
        '         "name": "Complete Prompt",',
        '         "value": "[FULL 300-500 WORD DETAILED PROMPT HERE]",',
        '         "explanation": "Copy this entire prompt"',
        '       },',
        '       {',
        '         "name": "Recommended Model",',
        '         "value": "Stability SD 3.5",',
        '         "explanation": "Brief reason why"',
        '       }',
        '     ]',
        '   • "basic_settings": [ // Provider-specific settings',
        '       { "name": "Model", "value": "large", "explanation": "..." },',
        '       { "name": "CFG Scale", "value": "10", "explanation": "..." },',
        '       { "name": "Steps", "value": "40", "explanation": "..." },',
        '       { "name": "Style Preset", "value": "line-art", "explanation": "..." },',
        '       { "name": "Aspect Ratio", "value": "1:1", "explanation": "..." }',
        '     ]',
        '   • "advanced_settings": [ // Shared Advanced section',
        '       { "name": "Brand Colors", "value": "Flexible", "explanation": "..." },',
        '       { "name": "Backdrop", "value": "Clean", "explanation": "..." },',
        '       { "name": "Lighting", "value": "Soft", "explanation": "..." },',
        '       { "name": "Quality", "value": "High detail", "explanation": "..." },',
        '       { "name": "Avoid", "value": "None", "explanation": "..." }',
        '     ]',
        '',
        '3. AVOID:',
        '   • ❌ Multiple copy buttons (one for model, one for style, one for aspect ratio)',
        '   • ❌ Generic short descriptions: "A black panther with diamond necklace"',
        '   • ❌ Listing settings as separate copyable items',
        '   • ❌ Irrelevant sources (only include sources related to the query)',
        '',
        '4. DO:',
        '   • ✅ ONE comprehensive detailed prompt (300-500 words)',
        '   • ✅ Describe EVERYTHING you see: pose, expression, accessories, materials, lighting, shadows, reflections, textures, colors, mood, atmosphere',
        '   • ✅ Use professional terminology',
        '   • ✅ Include quality markers',
        '   • ✅ Make it ready to copy and paste directly',
        '',
        '5. FOLLOW-UP QUESTIONS - CRITICAL CONTEXT RULE:',
        '   • If you recommended "FLUX Pro" and user asks "give me settings for the model" → They mean FLUX Pro',
        '   • If you recommended "Ideogram" and user asks "what about advanced settings" → They mean Ideogram',
        '   • "the model" ALWAYS refers to the model YOU recommended in the conversation',
        '   • Check conversation history BEFORE answering settings questions',
        '   • DO NOT switch to a different model (e.g., don\'t give Stability settings if you recommended FLUX Pro)',
        '   • Be consistent with your previous recommendations',
        '',
        '6. WHEN PROVIDING SETTINGS - MUST LIST ALL AVAILABLE OPTIONS:',
        '   ⚠️ CRITICAL: When user asks for "advanced settings" or "all settings", list EVERY option available',
        '   • DO NOT be selective - show ALL options from documentation',
        '   • DO NOT use "etc." - list complete options',
        '   ',
        '   PICTURES PANEL ADVANCED SETTINGS (applies to ALL providers):',
        '     - Brand Colors: Locked, Flexible',
        '     - Backdrop: Clean, Gradient, Real-world',
        '     - Lighting: Soft, Hard, Neon',
        '     - Quality: High detail, Sharp, Minimal noise',
        '     - Avoid: None, Logos, Busy background, Extra hands, Glare',
        '   ',
        '   FLUX Pro - BASIC SETTINGS:',
        '     - Mode: standard, ultra',
        '     - Aspect Ratio: 1:1, 16:9, 2:3, 3:2, 7:9, 9:7 (all 6 options)',
        '     - Guidance: 1.5-5 (slider, only in standard mode)',
        '     - Steps: 20-50 (slider, only in standard mode)',
        '     - Prompt Upsampling: Off/On',
        '     - RAW Mode: Off/On',
        '     - Output Format: jpeg, png, webp',
        '   ',
        '   Stability SD 3.5 - BASIC SETTINGS:',
        '     - Model: large, large-turbo, medium (all 3 options)',
        '     - CFG Scale: 1-20 (full range slider)',
        '     - Steps: 20-60 (full range slider)',
        '     - Style Preset: None, 3d-model, analog-film, anime, cinematic, comic-book, digital-art, enhance, fantasy-art, isometric, line-art, low-poly, modeling-compound, neon-punk, origami, photographic, pixel-art, tile-texture (ALL 18 options)',
        '     - Negative Prompt: Up to 500 characters (optional textarea)',
        '     - Aspect Ratio: 1:1, 2:3, 3:2, 16:9 (all 4 options)',
        '   ',
        '   Ideogram - BASIC SETTINGS:',
        '     - Model: v2, v1, turbo',
        '     - Magic Prompt: Off/On',
        '     - Style Type: AUTO, GENERAL, REALISTIC, DESIGN, RENDER_3D, ANIME (all 6 options)',
        '     - Negative Prompt: textarea (optional)',
        '     - Aspect Ratio: 1:1, 16:9, 2:3, 3:2, 7:9, 9:7 (all options)',
        '   ',
        '   DALL-E 3 - BASIC SETTINGS:',
        '     - Size: 1024x1024, 1024x1792, 1792x1024 (all 3 options)',
        '     - Quality: standard, hd (both options)',
        '     - Style: vivid, natural (both options)',
        '   ',
        '   ⚠️ When user asks for "advanced settings", include BOTH:',
        '   1. The Advanced section (Brand Colors, Backdrop, Lighting, Quality, Avoid)',
        '   2. The provider-specific settings (Model, CFG, Steps, etc.)',
        '',
        '# IMAGE ANALYSIS GUIDELINES',
        'When analyzing images, describe:',
        '- Subject: What/who is in the image (detailed description)',
        '- Composition: Camera angle, shot type, framing',
        '- Lighting: Type, direction, quality, shadows',
        '- Colors: Palette, dominant colors, saturation, temperature',
        '- Mood: Emotion, atmosphere, feeling',
        '- Style: Photorealistic, artistic, editorial, etc.',
        '- Background: What\'s behind, how it\'s treated',
        '- Technical: Focus, depth of field, quality markers',
        '',
        '⚠️ CRITICAL: MODEL RECOMMENDATION BASED ON IMAGE ANALYSIS',
        'Before recommending a model, ANALYZE THE IMAGE to determine the best fit:',
        '',
        '1. If image contains TEXT, TYPOGRAPHY, LOGOS, LETTERS:',
        '   → Recommend Ideogram',
        '   → Reason: Specialized for text rendering and typography',
        '',
        '2. If image is PHOTOREALISTIC (products, portraits, realistic scenes):',
        '   → Recommend FLUX Pro',
        '   → Reason: Best for photorealistic detail and textures',
        '',
        '3. If image is ARTISTIC, STYLIZED, ILLUSTRATED, PAINTED:',
        '   → Recommend Stability SD 3.5',
        '   → Reason: Offers 18 style presets for artistic control',
        '',
        '4. If image is CREATIVE, CONCEPTUAL, IMAGINATIVE:',
        '   → Recommend DALL-E 3',
        '   → Reason: Best for creative interpretation',
        '',
        'DO NOT default to FLUX Pro without analyzing the image!',
        '',
        'When creating prompts from images:',
        '- Be EXTREMELY specific about every visual detail you see',
        '- Use professional photography terminology',
        '- Include all color descriptions (be specific: "midnight black", "rose gold", "deep emerald")',
        '- Mention lighting setup and direction',
        '- Describe composition precisely',
        '- Include texture details (fur, fabric, metal, etc.)',
        '- Add quality markers (8K, professional, photorealistic, etc.)',
        '- Mention any accessories, props, or details',
        '- Describe the overall mood and atmosphere',
        '- For products/objects: material, finish, reflections',
        '- For people: age, expression, styling, clothing',
        '',
      ].join('\n') : '',
      '# IMPORTANT FOR VIDEO QUERIES',
      'If the query is about Luma Ray-2 or video settings, you MUST include ALL these parameters:',
      '- Duration: 5s or 9s',
      '- Resolution: 720p or 1080p',
      '- Loop: Off or Seamless',
      '- Camera Movement: Static, Pan Left, Pan Right, Zoom In, Zoom Out, Orbit Right',
      '- Camera Angle: Low, Eye Level, High, Bird\'s Eye',
      '- Camera Distance: Close-up, Medium, Wide, Extreme Wide',
      '- Style: Cinematic, Photorealistic, Artistic, Animated, Vintage',
      '- Lighting: Natural, Dramatic, Soft, Hard, Golden Hour, Blue Hour',
      '- Mood: Energetic, Calm, Mysterious, Joyful, Serious, Epic',
      '- Motion Intensity: Minimal, Moderate, High, Extreme',
      '- Motion Speed: Slow Motion, Normal, Fast Motion',
      '- Subject Movement: Static, Subtle, Active, Dynamic',
      '- Quality: Standard, High, Premium',
      '- Color Grading: Natural, Warm, Cool, Dramatic, Desaturated',
      '- Film Look: Digital, 35mm, 16mm, Vintage',
      '- Technical: Seed (optional), Guidance Scale (1-20), Negative Prompt (optional)',
      '',
      '# RESPONSE FORMAT',
      schemaInfo.instruction,
      '',
      '# SCHEMA',
      schemaInfo.schema,
      '',
      '# EXAMPLE',
      JSON.stringify(schemaInfo.example, null, 2),
      '',
      'Now answer the user\'s question using ONLY the documentation above.',
      'If images are attached, analyze them in detail.',
      'If asked about settings, provide COMPLETE list of all parameters.',
      'Return ONLY valid JSON matching the schema. No markdown, no extra text.',
    ].join('\n');
    
    // 4. Build messages array with vision support + maintain context
    // Convert structured responses to text summaries for better context retention
    const formatHistoryMessage = (msg) => {
      // User messages: always plain text
      if (msg.role === 'user') {
        return {
          role: 'user',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
        };
      }
      
      // Assistant messages: convert structured JSON to text summary
      if (msg.role === 'assistant' && typeof msg.content === 'object') {
        const content = msg.content;
        let summary = '';
        
        if (content.title) summary += `${content.title}\n\n`;
        if (content.brief || content.message) summary += `${content.brief || content.message}\n\n`;
        
        // Extract recommended model if present
        if (content.settings && Array.isArray(content.settings)) {
          const modelSetting = content.settings.find(s => s.name?.toLowerCase().includes('model'));
          if (modelSetting) summary += `Recommended Model: ${modelSetting.value}\n`;
        }
        
        if (content.recommendation) summary += `Recommendation: ${content.recommendation}\n`;
        
        return {
          role: 'assistant',
          content: summary.trim() || JSON.stringify(content),
        };
      }
      
      // Fallback: keep as-is
      return {
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
      };
    };
    
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(formatHistoryMessage),
    ];
    
    // 5. Build user message with images if attached
    if (hasImages) {
      // Vision mode: Build content array with text + images
      const imageContent = attachments
        .filter(att => att.type?.startsWith('image/'))
        .map(att => ({
          type: 'image_url',
          image_url: {
            url: `data:${att.type};base64,${att.data}`,
            detail: 'high', // High detail for better analysis
          },
        }));
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          ...imageContent,
        ],
      });
    } else {
      // Text-only mode
      messages.push({ role: 'user', content: message });
    }
    
    // 5. Call LLM with low temperature for consistency
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      temperature: 0.2, // Low temp for factual, consistent responses
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });
    
    let responseText = completion.choices?.[0]?.message?.content || '';
    
    // 6. Parse and validate response
    let parsedResponse = safeParseOrRepair(responseText);
    
    if (!parsedResponse) {
      // Fallback error response
      parsedResponse = {
        title: 'Response Error',
        message: 'I encountered an error processing the response. Please try rephrasing your question.',
        type: 'unknown',
        next_steps: [
          'Try asking about a specific panel (Content, Pictures, or Video)',
          'Ask about a specific feature or setting',
        ],
      };
    }
    
    // 7. Validate against schema
    const validation = validateResponse(parsedResponse, schemaType);
    
    // 8. Self-check validation: if invalid, try repair
    if (!validation.valid) {
      console.warn('[Badu Enhanced] Schema validation failed:', validation.errors);
      
      // Attempt repair with focused prompt
      const repairPrompt = [
        'The previous response had validation errors:',
        ...validation.errors,
        '',
        'Please return a corrected JSON response that strictly follows this schema:',
        schemaInfo.schema,
        '',
        'Use this example as reference:',
        JSON.stringify(schemaInfo.example, null, 2),
      ].join('\n');
      
      try {
        const repairCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            ...messages,
            { role: 'assistant', content: responseText },
            { role: 'user', content: repairPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        });
        
        const repairedText = repairCompletion.choices?.[0]?.message?.content || '';
        const repairedResponse = safeParseOrRepair(repairedText);
        
        if (repairedResponse) {
          const revalidation = validateResponse(repairedResponse, schemaType);
          if (revalidation.valid) {
            parsedResponse = repairedResponse;
          }
        }
      } catch (repairError) {
        console.error('[Badu Enhanced] Repair attempt failed:', repairError);
      }
    }
    
    // 9. Add sources to response
    if (sources.length > 0 && !parsedResponse.sources) {
      parsedResponse.sources = sources;
    }
    
    // 10. Sanitize response for disallowed terms (guardrail check)
    // Recursive sanitization to catch disallowed terms in nested fields and arrays
    const recursiveSanitize = (obj, path = '') => {
      if (typeof obj === 'string') {
        const sanitized = sanitizeBaduReply(obj);
        if (sanitized.flagged) {
          console.warn(`[Badu Enhanced] Sanitized field at ${path} for disallowed term: ${sanitized.reason}`);
          return sanitized.content;
        }
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map((item, index) => recursiveSanitize(item, `${path}[${index}]`));
      }
      
      if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = recursiveSanitize(value, path ? `${path}.${key}` : key);
        }
        return sanitized;
      }
      
      return obj;
    };
    
    parsedResponse = recursiveSanitize(parsedResponse);
    
    // 11. Return structured response
    return res.json({
      response: parsedResponse,
      type: schemaType,
      model: 'gpt-4o',
      temperature: 0.2,
      sources_used: sources.length,
      validated: validation.valid,
    });
    
  } catch (error) {
    console.error('[Badu Enhanced] Error:', error);
    
    // Categorize errors for better user feedback
    let errorTitle = 'Error';
    let errorMessage = 'I\'m having trouble processing your request. Please try again.';
    let errorSteps = ['Try rephrasing your question', 'Ask about a specific panel or feature'];
    let statusCode = 500;
    
    if (error.message?.includes('rate_limit')) {
      errorTitle = 'Rate Limit Exceeded';
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      errorSteps = ['Wait 30 seconds', 'Try your request again'];
      statusCode = 429;
    } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
      errorTitle = 'Request Timeout';
      errorMessage = 'The request took too long. Please try a simpler question.';
      errorSteps = ['Try asking about one specific feature', 'Break complex questions into smaller parts'];
      statusCode = 504;
    } else if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      errorTitle = 'Configuration Error';
      errorMessage = 'There\'s a configuration issue. Please contact support.';
      errorSteps = ['Contact your administrator'];
      statusCode = 503;
    } else if (error.message?.includes('content_policy') || error.message?.includes('moderation')) {
      errorTitle = 'Content Policy Violation';
      errorMessage = 'Your request was flagged by content moderation. Please rephrase.';
      errorSteps = ['Rephrase your question', 'Focus on marketing-related topics'];
      statusCode = 400;
    } else if (error.message?.includes('JSON')) {
      errorTitle = 'Response Format Error';
      errorMessage = 'I had trouble formatting the response. Please try again.';
      errorSteps = ['Try rephrasing your question', 'Ask for specific settings or features'];
      statusCode = 500;
    }
    
    return res.status(statusCode).json({
      response: {
        title: errorTitle,
        message: errorMessage,
        type: 'error',
        next_steps: errorSteps,
      },
      type: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// FEEDBACK TRACKING ENDPOINT
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/feedback', extractUserIdMiddleware, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const {
      userId,
      touchpointType,
      interactionType = 'complete',
      rating,
      ratingLabel,
      sessionId = null,
      timeSpentSeconds = null,
      interactionStartTime = null,
      interactionEndTime = null,
      contextData = {},
      pageUrl = null,
      comments = null,
      isAnonymous = false
    } = req.body;

    // Extract request metadata
    const ipAddress = feedbackTracker.extractIPAddress(req);
    const userAgent = feedbackTracker.extractUserAgent(req);

    // Use userId from body or from auth middleware
    const finalUserId = userId || req.userId;

    if (!finalUserId && !isAnonymous) {
      return res.status(401).json({
        error: 'User ID required',
        message: 'Please log in to submit feedback'
      });
    }

    // Validate required fields
    if (!touchpointType || rating === undefined || rating === null) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'touchpointType and rating are required'
      });
    }

    // Track feedback
    const feedbackRecord = await feedbackTracker.trackUserFeedback({
      userId: finalUserId,
      touchpointType,
      interactionType,
      rating,
      ratingLabel,
      sessionId,
      timeSpentSeconds,
      interactionStartTime,
      interactionEndTime,
      contextData,
      pageUrl,
      comments,
      isAnonymous,
      ipAddress,
      userAgent
    });

    const latency = Date.now() - startTime;

    console.log('[Feedback API] Feedback tracked:', {
      id: feedbackRecord?.id,
      touchpoint: touchpointType,
      rating: ratingLabel,
      latency: `${latency}ms`
    });

    res.json({
      success: true,
      feedback: feedbackRecord,
      latency,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('[Feedback API] Error:', error);
    res.status(500).json({
      error: 'Feedback submission failed',
      message: error.message
    });
  }
});

// Get user's feedback history
app.get('/api/feedback/history', extractUserIdMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50;
    
    // If no userId (admin/analytics view), get all recent feedback
    if (!userId) {
      const allFeedback = await feedbackTracker.getAllFeedback(limit);
      return res.json({
        success: true,
        feedback: allFeedback,
        count: allFeedback.length,
        type: 'all'
      });
    }

    // If userId exists, get user-specific feedback
    const feedbackHistory = await feedbackTracker.getUserFeedback(userId, limit);

    res.json({
      success: true,
      feedback: feedbackHistory,
      count: feedbackHistory.length,
      type: 'user'
    });
  } catch (error) {
    console.error('[Feedback API] Get history error:', error);
    res.status(500).json({
      error: 'Failed to retrieve feedback history',
      message: error.message
    });
  }
});

// Get feedback aggregations (analytics)
app.get('/api/feedback/aggregations', async (req, res) => {
  try {
    const periodType = req.query.period || 'daily';
    const limit = parseInt(req.query.limit) || 30;
    
    const aggregations = await feedbackTracker.getFeedbackAggregations(periodType, limit);

    res.json({
      success: true,
      aggregations,
      period: periodType,
      count: aggregations.length
    });
  } catch (error) {
    console.error('[Feedback API] Get aggregations error:', error);
    res.status(500).json({
      error: 'Failed to retrieve feedback aggregations',
      message: error.message
    });
  }
});

// Get feedback summary
app.get('/api/feedback/summary', async (req, res) => {
  try {
    const touchpointType = req.query.touchpoint || null;
    const summary = await feedbackTracker.getFeedbackSummary(touchpointType);

    res.json({
      success: true,
      summary,
      touchpoint: touchpointType || 'all'
    });
  } catch (error) {
    console.error('[Feedback API] Get summary error:', error);
    res.status(500).json({
      error: 'Failed to retrieve feedback summary',
      message: error.message
    });
  }
});

app.listen(process.env.PORT || 8787, () => {
  console.log(`AI Gateway listening on ${process.env.PORT || 8787}`)
  
  // Start analytics scheduler for budget monitoring, alerts, and optimizations
  analyticsScheduler.startScheduler()
  console.log('📊 Analytics scheduler started - monitoring budgets, alerts, and generating insights')
})
