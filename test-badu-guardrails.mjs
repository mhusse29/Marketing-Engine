#!/usr/bin/env node

import { BADU_KNOWLEDGE } from './shared/badu-knowledge.js'
import {
  BADU_SETTINGS_REFERENCE,
  isBaduTopic,
  sanitizeBaduReply,
} from './server/badu-context.js'

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function run() {
  // Topic gate must ignore unrelated questions
  assert(!isBaduTopic('What time is the game tonight?'), 'Off-topic question should be rejected')
  assert(
    isBaduTopic('Can you walk me through the Luma video settings?'),
    'Domain question should be accepted'
  )

  // Sanitizer should flag forbidden Luma controls
  const banned = sanitizeBaduReply('Try changing the depth of field to shallow for Luma.')
  assert(banned.flagged, 'Forbidden Luma parameter should trigger guardrail')
  assert(
    banned.content.includes(BADU_KNOWLEDGE.guardrails.fallbackOutsideScope),
    'Guardrail response must remind user about supported parameters'
  )

  const allowed = sanitizeBaduReply('Luma supports 5s or 9s duration with premium quality.')
  assert(!allowed.flagged, 'Supported parameters should pass sanitation')

  const settings = JSON.parse(BADU_SETTINGS_REFERENCE)
  assert(settings.panels?.video?.providers?.luma, 'Luma provider must be present in reference')
  assert(Array.isArray(settings.panels.content.personas), 'Content personas list is required')

  console.log('✅ Badu guardrail checks passed')
}

run()
