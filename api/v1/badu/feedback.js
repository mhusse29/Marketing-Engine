/**
 * BADU FEEDBACK API
 * Capture user feedback on BADU responses
 */

import { createClient } from '@supabase/supabase-js'
import { corsHeaders, handleCORS } from '../../_lib/cors.js'
import { extractUserId } from '../../_lib/auth.js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCORS(req, res)
  }

  // Add CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value)
  })

  const userId = await extractUserId(req)
  if (!userId) {
    return res.status(401).json({ error: 'unauthorized' })
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  try {
    const { message_id, rating, reason_tags, free_text } = req.body

    if (!message_id) {
      return res.status(400).json({ error: 'message_id_required' })
    }

    // Validate rating
    if (rating !== undefined && (rating < -1 || rating > 5)) {
      return res.status(400).json({ error: 'invalid_rating' })
    }

    // Insert feedback
    const { data, error } = await supabase
      .from('badu_feedback')
      .insert({
        message_id,
        user_id: userId,
        rating,
        reason_tags: reason_tags || [],
        free_text
      })
      .select()
      .single()

    if (error) throw error

    // Trigger async preference recomputation (fire and forget)
    supabase
      .rpc('get_user_preference_vector', { p_user_id: userId })
      .then(({ data: vector }) => {
        if (vector) {
          return supabase
            .from('badu_profiles')
            .update({ preference_vector: vector, updated_at: new Date().toISOString() })
            .eq('user_id', userId)
        }
      })
      .catch(err => console.warn('[Badu Feedback] Background update failed:', err))

    return res.json({
      success: true,
      feedback_id: data.id
    })
  } catch (error) {
    console.error('[Badu Feedback] Error:', error)
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}
