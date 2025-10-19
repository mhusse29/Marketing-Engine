import { BADU_KNOWLEDGE, buildBaduSettingsReference } from '../shared/badu-knowledge.js'

export const BADU_SETTINGS_REFERENCE = buildBaduSettingsReference()
const BADU_DISALLOWED_TERMS = BADU_KNOWLEDGE.lumaGuards.disallowedPhrases.map((term) => term.toLowerCase())
const BADU_TOPIC_KEYWORDS = [
  'content',
  'picture',
  'video',
  'panel',
  'setting',
  'config',
  'marketing',
  'sina',
  'badu',
  'campaign',
  'provider',
  'luma',
  'runway',
  'veo',
  'veo3',
  'flux',
  'dall',
  'stability',
  'ideogram',
  'persona',
  'tone',
  'cta',
  'parameter',
  'model',
]

export function isBaduTopic(message = '') {
  const lower = message.toLowerCase()
  return BADU_TOPIC_KEYWORDS.some((keyword) => lower.includes(keyword))
}

export function buildBaduSystemPrompt({ includeCoT = false } = {}) {
  const lines = [
    `${BADU_KNOWLEDGE.company.assistantName} is the official SINAIQ copilot. Stay on-platform, reference only the documented settings, and decline anything outside the Marketing Engine panels.`,
    `Company Focus:\n- Name: ${BADU_KNOWLEDGE.company.name}\n- Mission: ${BADU_KNOWLEDGE.company.mission}\n- Voice: ${BADU_KNOWLEDGE.company.voice}\n- Model: ${BADU_KNOWLEDGE.company.model}`,
    `App Settings Reference (JSON) - treat as the single source of truth:\n${BADU_SETTINGS_REFERENCE}`,
    `Luma Ray-2 Guardrail:\n- Only acknowledge the supported parameters shown in the settings reference.\n- If a user asks for anything else, explicitly state it is not available and suggest adjusting the prompt instead.`,
    `Response Rules:\n- Always link guidance back to the Content, Pictures, or Video panels.\n- If a request is outside scope, reply with: "${BADU_KNOWLEDGE.guardrails.fallbackOutsideScope}".\n- When unsure, use: "${BADU_KNOWLEDGE.guardrails.uncertaintyMessage}".\n- Prefer structured lists referencing exact option names.\n- Encourage validation steps inside the app.`,
    `Formatting Rules:\n- Use CLEAN GitHub Flavored Markdown for ALL responses.\n- Use **bold** for emphasis, not emojis.\n- Use proper headers: # for H1, ## for H2, ### for H3.\n- Use tables with proper markdown syntax for comparisons.\n- Use - or * for bullet lists, 1. 2. 3. for numbered lists.\n- Use \`code\` for inline parameter names.\n- Use code blocks with language tags for examples.\n- Do NOT use emojis, decorative symbols, or fancy Unicode characters.\n- Keep formatting professional and clean like ChatGPT or Claude.`,
  ]

  if (includeCoT) {
    lines.push(
      'Reasoning Protocol:\n1. Understand the question and map it to the relevant panel.\n2. Plan the response using only settings from the reference.\n3. Deliver the answer with clear steps and explicitly cite the options you chose.'
    )
  }

  return lines.join('\n\n')
}

export function sanitizeBaduReply(raw = '') {
  const text = raw.trim()
  if (!text) {
    return {
      content: BADU_KNOWLEDGE.guardrails.uncertaintyMessage,
      flagged: true,
      reason: 'empty-response',
    }
  }

  const lower = text.toLowerCase()
  for (const phrase of BADU_DISALLOWED_TERMS) {
    if (lower.includes(phrase)) {
      return {
        content: `${BADU_KNOWLEDGE.guardrails.fallbackOutsideScope}\n\nReminder: Luma Ray-2 only supports the parameters listed in the app settings reference.`,
        flagged: true,
        reason: phrase,
      }
    }
  }

  return { content: text, flagged: false }
}

export function buildBaduMessages({
  contextMessage,
  history,
  attachments,
  includeCoT = false,
}) {
  const systemPrompt = buildBaduSystemPrompt({ includeCoT })

  const baseMessages = [
    {
      role: 'system',
      content: systemPrompt,
    },
    ...history.slice(-20).map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
  ]

  const hasImages = attachments.some((att) => att?.type && att.type.startsWith('image/'))

  if (hasImages) {
    const content = [
      { type: 'text', text: contextMessage },
      ...attachments
        .filter((att) => att?.type && att.type.startsWith('image/'))
        .map((att) => ({
          type: 'image_url',
          image_url: { url: att.data },
        })),
    ]

    baseMessages.push({ role: 'user', content })
  } else {
    baseMessages.push({ role: 'user', content: contextMessage })
  }

  return baseMessages
}
