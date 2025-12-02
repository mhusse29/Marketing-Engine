/**
 * BADU ENHANCED V2 - COMPLETE IMPLEMENTATION
 * - Supabase persistence (sessions, messages, metrics)
 * - pgvector semantic search RAG
 * - User preferences and personalization
 * - Adaptive model selection
 * - SSE streaming support
 * - Comprehensive telemetry
 */

import 'dotenv/config'
import { config } from 'dotenv'
import { resolve } from 'path'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// CRITICAL: Load .env BEFORE initializing clients
config({ path: resolve(process.cwd(), 'server/.env') })

// Initialize clients AFTER env is loaded
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Generate embedding for semantic search
 */
async function generateEmbedding(text) {
  try {
    if (!openai) return null
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float'
    })
    return response.data[0].embedding
  } catch (error) {
    console.error('[Badu Enhanced] Embedding generation failed:', error)
    return null
  }
}

/**
 * Get multi-turn conversation context from session history
 */
async function getConversationContext(sessionId, limit = 5) {
  try {
    const { data } = await supabase
      .from('badu_messages')
      .select('role, raw_prompt, structured_response, detected_panel, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (!data || data.length === 0) return { turns: [], topics: [], patterns: {} }
    
    // Extract topics and patterns
    const topics = data.map(m => m.detected_panel).filter(Boolean)
    const patterns = {
      mostUsedPanel: topics[0] || null,
      recentQueries: data.filter(m => m.role === 'user').map(m => m.raw_prompt?.substring(0, 50)),
      conversationLength: data.length
    }
    
    return { turns: data.reverse(), topics, patterns }
  } catch (error) {
    console.error('[Badu Enhanced] Context fetch failed:', error)
    return { turns: [], topics: [], patterns: {} }
  }
}

/**
 * Get smart defaults from user history and preferences
 */
async function getSmartDefaults(userId, panel) {
  try {
    // Get user preferences
    const { data: profile } = await supabase
      .from('badu_profiles')
      .select('preferences, preference_vector')
      .eq('user_id', userId)
      .single()
    
    // Get recent successful patterns
    const { data: metrics } = await supabase
      .from('badu_metrics')
      .select('model, panel, status')
      .eq('user_id', userId)
      .eq('panel', panel)
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(20)
    
    const defaults = {
      suggestedModel: null,
      suggestedProvider: null,
      confidence: 0.5
    }
    
    if (profile?.preferences?.[panel]) {
      defaults.suggestedProvider = profile.preferences[panel].defaultProvider
      defaults.confidence = 0.8
    }
    
    if (metrics && metrics.length > 0) {
      const modelCounts = {}
      metrics.forEach(m => {
        modelCounts[m.model] = (modelCounts[m.model] || 0) + 1
      })
      const topModel = Object.keys(modelCounts).sort((a, b) => modelCounts[b] - modelCounts[a])[0]
      defaults.suggestedModel = topModel
      defaults.confidence = Math.min(0.9, 0.5 + (modelCounts[topModel] / metrics.length))
    }
    
    return defaults
  } catch (error) {
    console.error('[Badu Enhanced] Smart defaults failed:', error)
    return { suggestedModel: null, suggestedProvider: null, confidence: 0.5 }
  }
}

/**
 * Calculate confidence score for response
 */
function calculateConfidenceScore(context) {
  const { chunksRetrieved, avgScore, hasPreferences, conversationLength, modelUsed } = context
  
  let confidence = 0.5
  
  // RAG retrieval quality
  if (chunksRetrieved > 0 && avgScore) {
    confidence += avgScore * 0.3
  }
  
  // User preference match
  if (hasPreferences) {
    confidence += 0.15
  }
  
  // Conversation context
  if (conversationLength > 3) {
    confidence += 0.1
  }
  
  // Model reliability (GPT-4 more confident)
  if (modelUsed?.includes('gpt-4')) {
    confidence += 0.05
  }
  
  return Math.min(0.95, Math.max(0.4, confidence))
}

/**
 * Quality check for generated content
 */
async function runQualityChecks(content, panel, platform) {
  const issues = []
  
  try {
    // Get rules from DB
    const { data: rules } = await supabase
      .from('quality_check_rules')
      .select('*')
      .eq('panel', panel)
      .eq('is_active', true)
    
    if (!rules) return issues
    
    for (const rule of rules) {
      if (platform && rule.platform && rule.platform !== platform) continue
      
      const config = rule.rule_config
      
      switch (rule.check_type) {
        case 'length':
          if (content.length > config.max) {
            issues.push({
              severity: rule.severity,
              rule: rule.rule_name,
              message: `Content too long: ${content.length} chars (max: ${config.max})`
            })
          }
          break
          
        case 'readability':
          if (content.split(' ').length > config.max_words) {
            issues.push({
              severity: rule.severity,
              rule: rule.rule_name,
              message: `Too complex: ${content.split(' ').length} words (max: ${config.max_words})`
            })
          }
          break
      }
    }
  } catch (error) {
    console.error('[Badu Enhanced] Quality checks failed:', error)
  }
  
  return issues
}

/**
 * Get campaign template suggestions
 */
async function getCampaignTemplates(category, panel, industry = null) {
  try {
    let query = supabase
      .from('campaign_templates')
      .select('*')
      .eq('panel', panel)
      .eq('is_public', true)
      .order('proven_ctr', { ascending: false, nullsFirst: false })
      .limit(3)
    
    if (category) query = query.eq('category', category)
    if (industry) query = query.eq('industry', industry)
    
    const { data } = await query
    return data || []
  } catch (error) {
    console.error('[Badu Enhanced] Template fetch failed:', error)
    return []
  }
}

/**
 * Get budget optimization suggestions
 */
async function getBudgetSuggestions(userId) {
  try {
    const { data } = await supabase
      .from('budget_optimization_insights')
      .select('*')
      .eq('user_id', userId)
      .eq('is_read', false)
      .order('priority', { ascending: false })
      .order('potential_savings', { ascending: false })
      .limit(3)
    
    return data || []
  } catch (error) {
    console.error('[Badu Enhanced] Budget suggestions failed:', error)
    return []
  }
}

/**
 * Semantic RAG retrieval using pgvector
 */
async function retrieveContext(query, panelBias = null, providerBias = null, topK = 5) {
  const startTime = Date.now()
  
  try {
    // Generate query embedding
    const embedding = await generateEmbedding(query)
    if (!embedding) {
      return { chunks: [], latency: 0, error: 'embedding_failed' }
    }
    
    // Search using pgvector
    const { data, error } = await supabase.rpc('match_badu_docs', {
      query_embedding: embedding,
      top_k: topK,
      panel_bias: panelBias,
      provider_bias: providerBias
    })
    
    if (error) {
      console.error('[Badu Enhanced] RAG search failed:', error)
      return { chunks: [], latency: Date.now() - startTime, error: error.message }
    }
    
    const latency = Date.now() - startTime
    
    return {
      chunks: data || [],
      latency,
      chunkIds: data?.map(d => d.chunk_id) || [],
      scores: data?.map(d => d.similarity) || []
    }
  } catch (error) {
    console.error('[Badu Enhanced] RAG error:', error)
    return { chunks: [], latency: Date.now() - startTime, error: error.message }
  }
}

/**
 * Get or create user session
 */
async function getOrCreateSession(userId, channel = 'web') {
  // Try to get active session
  const { data: activeSessions, error: fetchError } = await supabase
    .from('badu_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('last_activity_at', { ascending: false })
    .limit(1)
  
  if (fetchError) {
    console.error('[Badu Enhanced] Session fetch failed:', fetchError)
  }
  
  // If active session exists and was used recently (within 1 hour), use it
  if (activeSessions && activeSessions.length > 0) {
    const session = activeSessions[0]
    const lastActivity = new Date(session.last_activity_at)
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    if (lastActivity > hourAgo) {
      return session
    }
  }
  
  // Create new session
  const { data: newSession, error: createError } = await supabase
    .from('badu_sessions')
    .insert({
      user_id: userId,
      channel,
      is_active: true
    })
    .select()
    .single()
  
  if (createError) {
    console.error('[Badu Enhanced] Session creation failed:', createError)
    return null
  }
  
  return newSession
}

/**
 * Fetch user preferences
 */
async function getUserPreferences(userId) {
  try {
    const { data, error } = await supabase
      .rpc('get_user_preference_vector', { p_user_id: userId })
    
    if (error) {
      console.warn('[Badu Enhanced] Preference fetch failed:', error)
      return {}
    }
    
    return data || {}
  } catch (error) {
    console.warn('[Badu Enhanced] Preference error:', error)
    return {}
  }
}

/**
 * Detect schema type and panel from query
 */
function detectSchemaAndPanel(query, hasImages = false) {
  const lower = query.toLowerCase()
  
  // Panel detection
  let panel = 'general'
  if (lower.includes('content') || lower.includes('copy') || lower.includes('caption')) {
    panel = 'content'
  } else if (lower.includes('picture') || lower.includes('image') || lower.includes('photo') || lower.includes('flux') || lower.includes('dall')) {
    panel = 'pictures'
  } else if (lower.includes('video') || lower.includes('clip') || lower.includes('animate') || lower.includes('veo') || lower.includes('runway') || lower.includes('luma')) {
    panel = 'video'
  }
  
  // Schema detection
  let schema = 'explanation'
  if (lower.includes('how to') || lower.includes('steps') || lower.includes('start')) {
    schema = 'quickstart'
  } else if (lower.includes('compare') || lower.includes('vs') || lower.includes('difference')) {
    schema = 'comparison'
  } else if (lower.includes('recommend') || lower.includes('should i') || lower.includes('best')) {
    schema = 'recommendation'
  } else if (lower.includes('setting') || lower.includes('configure') || lower.includes('option')) {
    schema = 'settings'
  } else if (hasImages) {
    schema = 'vision_analysis'
  }
  
  // Complexity score (0-1)
  let complexity = 0.3
  if (lower.split(' ').length > 20) complexity += 0.2
  if (hasImages) complexity += 0.3
  if (lower.includes('advanced') || lower.includes('detailed')) complexity += 0.2
  complexity = Math.min(complexity, 1.0)
  
  return { panel, schema, complexity }
}

/**
 * Calculate complexity score for prompt
 */
function calculateComplexityScore(message, attachments = [], history = []) {
  let score = 0.3 // Base score
  
  // Message length
  const wordCount = message.split(/\s+/).length
  if (wordCount > 100) score += 0.2
  if (wordCount > 200) score += 0.2
  
  // Technical terms
  const technicalTerms = ['API', 'webhook', 'integration', 'schema', 'database', 'algorithm', 'optimize']
  const hasTechnical = technicalTerms.some(term => message.toLowerCase().includes(term.toLowerCase()))
  if (hasTechnical) score += 0.15
  
  // Attachments (images add complexity)
  if (attachments.length > 0) score += 0.2
  if (attachments.length > 2) score += 0.1
  
  // Long conversation history
  if (history.length > 5) score += 0.1
  if (history.length > 10) score += 0.15
  
  // Multiple questions
  const questionMarks = (message.match(/\?/g) || []).length
  if (questionMarks > 2) score += 0.1
  
  return Math.min(1.0, score)
}

/**
 * Select appropriate model based on complexity and preferences
 * Routes heavy queries to gpt-5.1, lighter to gpt-4o
 */
function selectModel(complexity, hasImages, userPreferences = {}, attachmentCount = 0, requiresLongOutput = false) {
  // Thresholds for adaptive switching
  const highComplexityThreshold = 0.75
  const mediumComplexityThreshold = 0.5
  
  // Detailed prompts need more tokens
  if (requiresLongOutput) {
    return {
      model: 'gpt-4o',
      maxTokens: 3000,
      reason: 'long_output_required',
      complexity_score: complexity
    }
  }
  
  // Heavy queries → gpt-5.1 (if available)
  if (complexity > highComplexityThreshold || attachmentCount > 3) {
    return {
      model: 'gpt-4o', // Fallback to gpt-4o for now (upgrade to gpt-5.1 when available)
      maxTokens: 3000,
      reason: 'high_complexity',
      complexity_score: complexity
    }
  }
  
  // Medium complexity or images → gpt-4o
  if (complexity > mediumComplexityThreshold || hasImages) {
    return {
      model: 'gpt-4o',
      maxTokens: 2000,
      reason: 'medium_complexity',
      complexity_score: complexity
    }
  }
  
  // Light queries → gpt-4o-mini
  return {
    model: 'gpt-4o-mini',
    maxTokens: 800,
    reason: 'low_complexity',
    complexity_score: complexity
  }
}

/**
 * Save message to database
 */
async function saveMessage(sessionId, userId, role, content, metadata = {}) {
  try {
    const { data, error } = await supabase
      .from('badu_messages')
      .insert({
        session_id: sessionId,
        user_id: userId,
        role,
        raw_prompt: typeof content === 'string' ? content : JSON.stringify(content),
        structured_response: role === 'assistant' ? content : null,
        schema_type: metadata.schema_type,
        detected_panel: metadata.detected_panel,
        sources: metadata.sources || [],
        model: metadata.model,
        tokens_used: metadata.tokens_used,
        latency_ms: metadata.latency_ms,
        has_attachments: metadata.has_attachments || false,
        attachment_types: metadata.attachment_types || []
      })
      .select()
      .single()
    
    if (error) {
      console.error('[Badu Enhanced] Message save failed:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('[Badu Enhanced] Message save error:', error)
    return null
  }
}

/**
 * Log metrics
 */
async function logMetrics(userId, sessionId, messageId, metrics) {
  try {
    await supabase.from('badu_metrics').insert({
      user_id: userId,
      session_id: sessionId,
      message_id: messageId,
      ...metrics
    })
  } catch (error) {
    console.error('[Badu Enhanced] Metrics logging failed:', error)
  }
}

/**
 * Main enhanced chat handler
 */
export async function handleEnhancedChat(req, res, userId) {
  console.log('[Enhanced Chat] Request received for user:', userId)
  const startTime = Date.now()
  const { message, history = [], attachments = [], stream = false } = req.body
  
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'message_required' })
  }
  
  if (!openai) {
    console.error('[Enhanced Chat] OpenAI not configured')
    return res.status(503).json({ 
      error: 'openai_not_configured',
      message: 'OpenAI API key not configured. Please set OPENAI_API_KEY in server/.env'
    })
  }
  
  console.log('[Enhanced Chat] Processing message:', message.substring(0, 50))
  
  try {
    // 1. Get or create session
    const session = await getOrCreateSession(userId, 'web')
    if (!session) {
      return res.status(500).json({ error: 'session_creation_failed' })
    }
    
    // 2. Get conversation context (multi-turn)
    const convContext = await getConversationContext(session.id)
    console.log('[Enhanced Chat] Conversation context:', convContext.patterns)
    
    // 3. Check if user wants to skip preferences for this session
    const skipPreferences = req.headers['x-skip-preferences'] === 'true'
    
    // 4. Fetch user preferences (unless skipped)
    const preferences = skipPreferences ? { stored_preferences: null } : await getUserPreferences(userId)
    if (skipPreferences) {
      console.log('[Enhanced Chat] Preferences skipped by user override')
    }
    
    // 5. Calculate complexity score
    const complexityScore = calculateComplexityScore(message, attachments, history)
    console.log('[Enhanced Chat] Complexity score:', complexityScore)
    
    // 5. Detect panel, schema, and complexity
    const hasImages = attachments.some(att => att.type?.startsWith('image/'))
    const detection = detectSchemaAndPanel(message, hasImages)
    
    // 6. Get smart defaults for this panel (unless preferences skipped)
    const smartDefaults = skipPreferences ? { suggestedProvider: null, confidence: 0 } : await getSmartDefaults(userId, detection.panel)
    console.log('[Enhanced Chat] Smart defaults:', smartDefaults)
    
    // 6. Get campaign templates if applicable
    const templates = await getCampaignTemplates(null, detection.panel)
    
    // 7. Get budget suggestions
    const budgetSuggestions = await getBudgetSuggestions(userId)
    
    // 8. RAG: Semantic retrieval with panel bias
    const retrievalStart = Date.now()
    const { chunks, latency: retrievalLatency, chunkIds, scores } = await retrieveContext(
      message,
      detection.panel !== 'general' ? detection.panel : null,
      smartDefaults.suggestedProvider,
      hasImages ? 3 : 5
    )
    
    // Build context from chunks
    const contextText = chunks
      .map(chunk => `# ${chunk.title}\n\n${chunk.markdown}`)
      .join('\n\n---\n\n')
    
    // Check if this is a detailed prompt request (needs more output tokens)
    const isDetailedPromptRequest = 
      (detection.panel === 'video' || detection.panel === 'pictures') &&
      (message.toLowerCase().includes('prompt') || 
       message.toLowerCase().includes('detailed') || 
       message.toLowerCase().includes('scene') || 
       message.toLowerCase().includes('animate'))
    
    // Use calculated complexity for adaptive model selection
    const modelSelection = selectModel(complexityScore, hasImages, preferences, attachments.length, isDetailedPromptRequest)
    console.log('[Enhanced Chat] Model selection:', modelSelection.model, 'reason:', modelSelection.reason, 'maxTokens:', modelSelection.maxTokens)
    
    // 9. Build system prompt with preferences and context
    const systemPrompt = [
      'You are BADU, an expert marketing AI assistant for the SINAIQ platform.',
      '',
      '# YOUR JOB',
      'Give SPECIFIC, ACTIONABLE advice using the documentation below.',
      'ALWAYS mention provider names (FLUX Pro, Ideogram, DALL·E, etc.) explicitly.',
      'Compare options with pros/cons when relevant.',
      'Be direct and helpful - no generic statements.',
      '',
      detection.panel === 'video' && (message.toLowerCase().includes('prompt') || message.toLowerCase().includes('scene') || message.toLowerCase().includes('animate')) ?
        '🚨 CRITICAL INSTRUCTION FOR THIS REQUEST:\nThe user wants a DETAILED VIDEO SCENE PROMPT (300-500 words) they can paste into Runway VEO3.\nPut the COMPLETE scene prompt in the "brief" JSON field.\nDO NOT give generic steps like "1. Open VEO3 2. Import image 3. Set keyframes".\nGive the ACTUAL SCENE DESCRIPTION with: camera movement (dolly in/pan/orbit), subject motion with timing (2-3px/sec), lighting evolution (5500K→3500K), cinematography refs (Roger Deakins), technical specs (9:16, 24fps, 180° shutter).\nExample: "Opening on wide shot... cinematic dolly-in over 8 seconds... glass hexagon rotates 15°... lighting shifts from cool to warm..." etc.\n' : '',
      '',
      detection.panel === 'pictures' && (message.toLowerCase().includes('prompt') || message.toLowerCase().includes('detailed') || message.toLowerCase().includes('scene')) ?
        '🚨 CRITICAL INSTRUCTION FOR THIS REQUEST:\nThe user wants a DETAILED IMAGE PROMPT (300-500 words) for FLUX/DALL-E/etc.\nPut the COMPLETE technical prompt in the "brief" JSON field.\nDO NOT give generic advice.\nGive the ACTUAL PROMPT with: hex colors (#ffb3d9), camera specs (85mm, f/2.0), lighting angles (45° left, 5500K), technical details (8K, Adobe RGB, 4:5 ratio).\nExample: "A surreal composition featuring... on gradient sky from pink (#ffb3d9) to yellow (#ffd93d)... shot with 85mm lens..." etc.\n' : '',
      '',
      convContext.patterns.conversationLength > 0 ? 
        `Context: User has asked ${convContext.patterns.conversationLength} questions, mostly about ${convContext.patterns.mostUsedPanel}` : '',
      '',
      preferences.stored_preferences ? 
        `User prefers: ${JSON.stringify(preferences.stored_preferences)}` : '',
      '',
      smartDefaults.suggestedProvider && smartDefaults.confidence > 0.7 ?
        `🎯 Based on their history: Recommend ${smartDefaults.suggestedProvider} (${Math.round(smartDefaults.confidence * 100)}% match)` : '',
      '',
      templates.length > 0 ?
        `📋 Proven templates: ${templates.map(t => `${t.name} (${t.proven_ctr}% CTR)`).join(', ')}` : '',
      '',
      budgetSuggestions.length > 0 ?
        `💰 Cost tip: ${budgetSuggestions[0].title}` : '',
      '',
      '# DOCUMENTATION',
      contextText || 'No specific documentation found - use general knowledge.',
      '',
      detection.panel === 'pictures' && (message.toLowerCase().includes('prompt') || message.toLowerCase().includes('detailed') || message.toLowerCase().includes('scene')) ?
        `\n# DETAILED IMAGE PROMPT GUIDELINES\nWhen asked for a detailed/professional image prompt, provide 300-500 words including:\n\n**STRUCTURE:** Subject + Background (with hex colors like #ffb3d9) + Lighting (angle, temp: "45° left, 5500K") + Camera (85mm, f/2.0, ISO 100) + Composition (rule of thirds, 40% negative space) + Post-processing (+20% glow, +15% saturation) + Style (Vogue, Apple) + Technical (8K, Adobe RGB, 4:5 ratio)\n\n**EXAMPLE - Abstract Cloud:** "A surreal composition featuring a photorealistic cumulus cloud against a gradient sky from pastel pink (#ffb3d9) through coral orange (#ff6b6b) to golden yellow (#ffd93d). Cloud with extreme detail, individual wisps, subsurface scattering at 5000K. Transparent glass hexagon (40% opacity, 2px frosted edge) framing cloud with internal reflections. Three translucent triangles (20% opacity) floating around. Dramatic backlight from upper right creating rim glow (#ffffff), volumetric fog (10% opacity), god rays at 15° angle. Camera: 50mm, f/2.0. Post: +20% glow, +15% saturation, -10% vignette. Style: surrealism, album cover quality. Technical: 6K (6000×4000), ProPhoto RGB, 3:2, 16-bit."\n\n**ALWAYS include:** hex codes, camera specs, lighting angles, style refs, technical specs.\n` : '',
      '',
      detection.panel === 'video' && (message.toLowerCase().includes('prompt') || message.toLowerCase().includes('scene') || message.toLowerCase().includes('animate')) ?
        `\n# DETAILED VIDEO/ANIMATION PROMPT GUIDELINES\nWhen asked for video animation prompts, provide 300-500 words including:\n\n**STRUCTURE FOR VEO3 (Runway):** Starting scene + Camera movement (dolly/pan/zoom/orbit) + Subject action + Lighting changes + Environment details + Speed/pace + Style reference + Technical specs (aspect ratio, duration)\n\n**VEO3 SETTINGS:**\n- Duration: 8 seconds (fixed)\n- Aspect Ratio: 9:16 (Stories/Reels), 1:1 (Feed), 16:9 (YouTube)\n- Camera Motion: Specify explicitly (dolly in, pan left, orbit clockwise, static)\n- Speed: "slow motion", "real-time", "time-lapse"\n- Style: "cinematic", "handheld", "drone shot", "tracking shot"\n\n**EXAMPLE - Animate Cloud Scene:** "Opening on a wide shot of the surreal abstract cloud composition against gradient sky (pastel pink #ffb3d9 to golden yellow #ffd93d). Cinematic dolly-in movement starting at 2x distance, smoothly pushing toward the cloud over 8 seconds, ending at medium close-up revealing individual wispy details. Glass hexagon frame gently rotates clockwise at 15° total rotation throughout the shot. Translucent triangle shapes float and drift slowly around cloud (2-3 pixels per second movement). Lighting subtly shifts from cool morning light (5500K) to warm golden hour (3500K) over duration, creating dynamic rim glow that intensifies on cloud edges. Atmospheric depth enhanced with volumetric fog (10% opacity) that subtly increases density. God rays penetrate through cloud at 15° angle, animated to slowly sweep from left to right (30° arc over 8 seconds). Camera maintains smooth, stabilized motion - no handheld shake. Depth of field: f/2.0 throughout with subtle focus pull keeping cloud sharp as camera moves closer. Motion blur: enabled at 180° shutter for cinematic fluidity. Frame rate: 24fps for film-like cadence. Color grade: dreamy, ethereal with +20% glow, +15% saturation on warm tones, -10% vignette. Style: high-end commercial cinematography, Apple product launch aesthetic, Christopher Nolan visual treatment. Technical: 9:16 vertical for Instagram Stories/Reels, 8-second duration, ProRes 422 HQ equivalent quality."\n\n**CAMERA MOVEMENTS:** Dolly in/out, pan left/right, tilt up/down, orbit clockwise/counterclockwise, zoom in/out, tracking shot, crane up/down, handheld, static\n\n**VEO3 BEST PRACTICES:**\n- Describe ONE main camera move per shot (dolly in OR pan, not both)\n- Specify speed: "slow dolly in over 8 seconds" not just "dolly in"\n- Mention lighting changes if scene should evolve\n- Describe subject motion: "cloud wisps gently drift" not just "cloud moves"\n- Include environment details: fog, particles, reflections\n- Reference cinematography style: "Roger Deakins lighting", "Denis Villeneuve pacing"\n- Always specify aspect ratio based on platform (9:16 for Stories/TikTok)\n\n**ALWAYS include:** Camera movement, subject action, lighting evolution, speed/timing, style reference, technical specs.\n` : '',
      '',
      '# OUTPUT FORMAT',
      'Return ONLY valid JSON:',
      '{',
      '  "title": "Which Provider for Instagram Product Images?",',
      '  "brief": "Short summary here",',
      '  "bullets": ["Specific point with provider name", "Another specific recommendation"],',
      '  "next_steps": ["Use FLUX Pro and select...", "Set guidance scale to..."],',
      '  "type": "help"',
      '}',
      '',
      detection.panel === 'pictures' && (message.toLowerCase().includes('prompt') || message.toLowerCase().includes('detailed') || message.toLowerCase().includes('scene')) ?
        '**CRITICAL FOR IMAGE PROMPTS:** Put the FULL 300-500 word detailed technical prompt in the "brief" field. Do NOT give generic steps - give the complete copy-paste-ready prompt with hex codes, camera specs, lighting angles, and technical details.' : '',
      '',
      detection.panel === 'video' && (message.toLowerCase().includes('prompt') || message.toLowerCase().includes('scene') || message.toLowerCase().includes('animate')) ?
        '**CRITICAL FOR VIDEO PROMPTS:** Put the FULL 300-500 word detailed scene prompt in the "brief" field. Include: camera movement (dolly in/out, pan, orbit), subject action with timing (2-3px/sec), lighting evolution (5500K → 3500K), speed specifications (over 8 seconds), cinematography references (Roger Deakins), and technical specs (9:16, 24fps, 180° shutter). Do NOT give generic steps like "open VEO3" - give the actual detailed scene prompt they can paste into Runway.' : '',
      '',
      'Use "next_steps" array for actionable steps.',
      '',
      'Example structure:',
      '{"title": "Best Provider for [Use Case]", "message": "Use FLUX Pro because...", "next_steps": ["Step 1", "Step 2"]}',
    ].filter(Boolean).join('\n')
    
    // 7. Build messages with history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map(msg => ({
        role: msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      }))
    ]
    
    // Add user message with images if present
    if (hasImages) {
      const imageContent = attachments
        .filter(att => att.type?.startsWith('image/'))
        .map(att => ({
          type: 'image_url',
          image_url: {
            url: `data:${att.type};base64,${att.data}`,
            detail: 'high'
          }
        }))
      
      messages.push({
        role: 'user',
        content: [
          { type: 'text', text: message },
          ...imageContent
        ]
      })
    } else {
      messages.push({ role: 'user', content: message })
    }
    
    // Save user message with complexity score
    await saveMessage(session.id, userId, 'user', message, {
      detected_panel: detection.panel,
      schema_type: detection.schema,
      has_attachments: attachments.length > 0,
      attachment_types: attachments.map(a => a.type),
      complexity_score: complexityScore,
      model_variant: modelSelection.model
    })
    
    // 8. Call LLM (with streaming support)
    const llmStart = Date.now()
    
    const completionParams = {
      model: modelSelection.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
      stream
    }
    
    if (modelSelection.model.startsWith('gpt-5')) {
      completionParams.max_completion_tokens = modelSelection.maxTokens
    } else {
      completionParams.max_tokens = modelSelection.maxTokens
    }
    
    console.log('[Enhanced Chat] OpenAI params:', {
      model: completionParams.model,
      max_tokens: completionParams.max_tokens || completionParams.max_completion_tokens,
      stream: completionParams.stream,
      reason: modelSelection.reason
    })
    
    // Handle streaming
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream')
      res.setHeader('Cache-Control', 'no-cache')
      res.setHeader('Connection', 'keep-alive')
      
      // Send initial meta event with retrieval diagnostics + smart context
      const streamAvgScore = scores.length > 0 ? scores.reduce((a,b) => a + b, 0) / scores.length : 0
      const streamConfidence = calculateConfidenceScore({
        chunksRetrieved: chunks.length,
        avgScore: streamAvgScore,
        hasPreferences: !!preferences.stored_preferences,
        conversationLength: convContext.patterns.conversationLength,
        modelUsed: modelSelection.model
      })
      
      res.write(`data: ${JSON.stringify({
        type: 'meta',
        panel: detection.panel,
        schema: detection.schema,
        model: modelSelection.model,
        chunks: chunkIds,
        scores,
        retrieval_ms: retrievalLatency,
        confidence: Math.round(streamConfidence * 100),
        smartDefaults: smartDefaults.suggestedProvider ? {
          provider: smartDefaults.suggestedProvider,
          confidence: Math.round(smartDefaults.confidence * 100)
        } : null,
        templates: templates.length > 0 ? templates.map(t => ({name: t.name, ctr: t.proven_ctr})) : null,
        conversationContext: {
          messageCount: convContext.patterns.conversationLength,
          mostUsedPanel: convContext.patterns.mostUsedPanel
        }
      })}\n\n`)
      
      const stream = await openai.chat.completions.create(completionParams)
      
      let fullResponse = ''
      let partialJSON = ''
      
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content || ''
        if (content) {
          fullResponse += content
          partialJSON += content
          
          // Send token
          res.write(`data: ${JSON.stringify({ type: 'token', content })}\n\n`)
          
          // Try to parse partial JSON and send structured updates
          try {
            const partial = JSON.parse(partialJSON)
            if (partial.title) {
              res.write(`data: ${JSON.stringify({ type: 'title', content: partial.title })}\n\n`)
            }
          } catch {
            // Not yet valid JSON, continue
          }
        }
      }
      
      // Validate JSON is complete before sending done
      let finalResponse = fullResponse
      try {
        JSON.parse(fullResponse)
      } catch (parseError) {
        console.error('[Enhanced Chat] Incomplete JSON from LLM:', parseError.message)
        console.error('[Enhanced Chat] Response length:', fullResponse.length, 'chars')
        // Send error response if JSON is incomplete
        finalResponse = JSON.stringify({
          title: 'Response Incomplete',
          brief: 'The AI response was cut off. Please try again with a shorter query.',
          bullets: ['Response exceeded token limit', 'Try breaking your question into smaller parts'],
          next_steps: ['Ask a more specific question', 'Try again'],
          type: 'error'
        })
      }
      
      // Send done with complete response
      res.write(`data: ${JSON.stringify({ type: 'done', response: finalResponse })}\n\n`)
      res.end()
      
      const llmLatency = Date.now() - llmStart
      
      // Parse response
      let parsedResponse
      try {
        parsedResponse = JSON.parse(fullResponse)
      } catch {
        parsedResponse = {
          title: 'Response Error',
          message: 'Failed to parse response',
          type: 'error'
        }
      }
      
      // Calculate confidence score
      const avgScore = scores.length > 0 ? scores.reduce((a,b) => a + b, 0) / scores.length : 0
      const confidence = calculateConfidenceScore({
        chunksRetrieved: chunks.length,
        avgScore,
        hasPreferences: !!preferences.stored_preferences,
        conversationLength: convContext.patterns.conversationLength,
        modelUsed: modelSelection.model
      })
      
      // Add metadata to response
      parsedResponse._meta = {
        confidence: Math.round(confidence * 100),
        smartDefaults: smartDefaults.suggestedProvider ? {
          provider: smartDefaults.suggestedProvider,
          confidence: Math.round(smartDefaults.confidence * 100)
        } : null
      }
      
      // Save assistant message
      const assistantMessage = await saveMessage(session.id, userId, 'assistant', parsedResponse, {
          detected_panel: detection.panel,
          schema_type: detection.schema,
          sources: chunkIds,
          model: modelSelection.model,
          latency_ms: llmLatency
      })
      
      // Log metrics
      await logMetrics(userId, session.id, assistantMessage?.id, {
        schema_type: detection.schema,
        model: modelSelection.model,
        panel: detection.panel,
        retrieval_latency_ms: retrievalLatency,
        llm_latency_ms: llmLatency,
        total_latency_ms: Date.now() - startTime,
        chunks_retrieved: chunks.length,
        chunk_ids: chunkIds,
        chunk_scores: scores,
        user_preference_applied: Object.keys(preferences).length > 0,
        status: 'success'
      })
      
      return
    }
    
    // Non-streaming response
    const completion = await openai.chat.completions.create(completionParams)
    const responseText = completion.choices?.[0]?.message?.content || ''
    const llmLatency = Date.now() - llmStart
    
    // Parse response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(responseText)
    } catch {
      parsedResponse = {
        title: 'Response Error',
        message: 'Failed to parse response',
        type: 'error'
      }
    }
    
    // Calculate confidence score
    const avgScore = scores.length > 0 ? scores.reduce((a,b) => a + b, 0) / scores.length : 0
    const confidence = calculateConfidenceScore({
      chunksRetrieved: chunks.length,
      avgScore,
      hasPreferences: !!preferences.stored_preferences,
      conversationLength: convContext.patterns.conversationLength,
      modelUsed: modelSelection.model
    })
    
    // Add metadata to response
    parsedResponse._meta = {
      confidence: Math.round(confidence * 100),
      smartDefaults: smartDefaults.suggestedProvider ? {
        provider: smartDefaults.suggestedProvider,
        confidence: Math.round(smartDefaults.confidence * 100)
      } : null
    }
    
    // Save assistant message
    const assistantMessage = await saveMessage(session.id, userId, 'assistant', parsedResponse, {
      detected_panel: detection.panel,
      schema_type: detection.schema,
      sources: chunkIds,
      model: modelSelection.model,
      tokens_used: completion.usage?.total_tokens,
      latency_ms: llmLatency
    })
    
    // Log metrics
    await logMetrics(userId, session.id, assistantMessage?.id, {
      schema_type: detection.schema,
      model: modelSelection.model,
      panel: detection.panel,
      input_tokens: completion.usage?.prompt_tokens,
      output_tokens: completion.usage?.completion_tokens,
      total_tokens: completion.usage?.total_tokens,
      retrieval_latency_ms: retrievalLatency,
      llm_latency_ms: llmLatency,
      total_latency_ms: Date.now() - startTime,
      chunks_retrieved: chunks.length,
      chunk_ids: chunkIds,
      chunk_scores: scores,
      user_preference_applied: Object.keys(preferences).length > 0,
      status: 'success'
    })
    
    // Return response
    return res.json({
      response: parsedResponse,
      metadata: {
        message_id: assistantMessage?.id,
        session_id: session.id,
        panel: detection.panel,
        schema: detection.schema,
        model: modelSelection.model,
        sources: chunkIds,
        retrieval_latency_ms: retrievalLatency,
        llm_latency_ms: llmLatency,
        total_latency_ms: Date.now() - startTime
      }
    })
    
  } catch (error) {
    console.error('[Badu Enhanced] Error:', error)
    
    // Log error metrics
    await logMetrics(userId, null, null, {
      status: 'error',
      error_message: error.message,
      total_latency_ms: Date.now() - startTime
    })
    
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}
