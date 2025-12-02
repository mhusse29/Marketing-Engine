/**
 * BADU PREFERENCES API
 * Manage user preferences, soft defaults, and personalization
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

  try {
    switch (req.method) {
      case 'GET':
        return await getPreferences(req, res, userId)
      case 'PUT':
        return await updatePreferences(req, res, userId)
      case 'POST':
        return await computePreferences(req, res, userId)
      default:
        return res.status(405).json({ error: 'method_not_allowed' })
    }
  } catch (error) {
    console.error('[Badu Preferences] Error:', error)
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}

/**
 * GET /api/v1/badu/preferences
 * Fetch user's stored preferences and computed soft defaults
 */
async function getPreferences(req, res, userId) {
  // Get profile with preferences
  const { data: profile, error: profileError } = await supabase
    .from('badu_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError
  }

  // If no profile exists, create one
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('badu_profiles')
      .insert({
        user_id: userId,
        tier: 'demo',
        role: 'marketer'
      })
      .select()
      .single()

    if (createError) throw createError

    return res.json({
      preferences: newProfile.preferences,
      preference_vector: newProfile.preference_vector,
      favorite_panels: newProfile.favorite_panels,
      tier: newProfile.tier,
      isNew: true
    })
  }

  // Get computed preference vector
  const { data: computedVector, error: vectorError } = await supabase
    .rpc('get_user_preference_vector', { p_user_id: userId })

  if (vectorError) {
    console.warn('[Badu Preferences] Failed to compute vector:', vectorError)
  }

  return res.json({
    preferences: profile.preferences,
    preference_vector: computedVector || profile.preference_vector,
    favorite_panels: profile.favorite_panels,
    tier: profile.tier,
    role: profile.role,
    isNew: false
  })
}

/**
 * PUT /api/v1/badu/preferences
 * Update user's explicit preferences
 */
async function updatePreferences(req, res, userId) {
  const { preferences, favorite_panels, preferred_language } = req.body

  const updates = {}
  if (preferences) updates.preferences = preferences
  if (favorite_panels) updates.favorite_panels = favorite_panels
  if (preferred_language) updates.preferred_language = preferred_language
  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('badu_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error

  return res.json({
    success: true,
    preferences: data.preferences,
    favorite_panels: data.favorite_panels
  })
}

/**
 * POST /api/v1/badu/preferences/compute
 * Trigger background recomputation of preference vector
 */
async function computePreferences(req, res, userId) {
  // Call RPC to recompute
  const { data: computedVector, error } = await supabase
    .rpc('get_user_preference_vector', { p_user_id: userId })

  if (error) throw error

  // Store computed vector
  const { error: updateError } = await supabase
    .from('badu_profiles')
    .update({
      preference_vector: computedVector,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)

  if (updateError) throw updateError

  return res.json({
    success: true,
    preference_vector: computedVector
  })
}
