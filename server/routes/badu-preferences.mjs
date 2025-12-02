import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: 'server/.env' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * GET /api/v1/badu/preferences
 * Returns user's stored preferences from badu_profiles
 */
export async function getPreferences(req, res, userId) {
  try {
    const { data: profile, error } = await supabase
      .from('badu_profiles')
      .select('preferences, tier, role, preferred_language, favorite_panels')
      .eq('user_id', userId)
      .single()
    
    // Handle case where user doesn't have a profile yet
    if (error && error.code === 'PGRST116') {
      console.log('[BADU Preferences] No profile found for user, creating default...')
      
      // Create a default profile for this user
      const defaultProfile = {
        user_id: userId,
        tier: 'demo',
        role: 'marketer',
        preferred_language: 'en',
        favorite_panels: [],
        preferences: {
          content: {
            defaultTone: 'Professional',
            defaultPersona: 'Generic',
            defaultPlatforms: ['Facebook', 'Instagram']
          },
          pictures: {
            defaultStyle: 'modern',
            defaultProvider: 'flux'
          },
          video: {
            defaultDuration: 5,
            defaultProvider: 'runway'
          }
        }
      }
      
      // Create the profile
      const { error: insertError } = await supabase
        .from('badu_profiles')
        .insert(defaultProfile)
      
      if (insertError) {
        console.error('[BADU Preferences] Failed to create profile:', insertError)
      }
      
      // Return defaults
      return res.json({
        preferences: defaultProfile.preferences,
        tier: defaultProfile.tier,
        role: defaultProfile.role,
        preferred_language: defaultProfile.preferred_language,
        favorite_panels: defaultProfile.favorite_panels,
        isNew: true
      })
    }
    
    if (error) {
      console.error('[BADU Preferences] Fetch failed:', error)
      return res.status(500).json({ error: 'preferences_fetch_failed' })
    }
    
    if (!profile) {
      // Shouldn't reach here after the above check, but just in case
      return res.json({
        preferences: {
          content: {
            defaultTone: 'Professional',
            defaultPersona: 'Generic',
            defaultPlatforms: ['Facebook', 'Instagram']
          },
          pictures: {
            defaultStyle: 'modern',
            defaultProvider: 'flux'
          },
          video: {
            defaultDuration: 5,
            defaultProvider: 'runway'
          }
        },
        tier: 'demo',
        role: 'marketer',
        preferred_language: 'en',
        favorite_panels: [],
        isNew: true
      })
    }
    
    return res.json({
      preferences: profile.preferences,
      tier: profile.tier,
      role: profile.role,
      preferred_language: profile.preferred_language,
      favorite_panels: profile.favorite_panels,
      isNew: false
    })
  } catch (error) {
    console.error('[BADU Preferences] Error:', error)
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}

/**
 * PUT /api/v1/badu/preferences
 * Updates user's preferences
 */
export async function updatePreferences(req, res, userId) {
  try {
    const { preferences, favorite_panels, preferred_language } = req.body
    
    const updates = {}
    if (preferences) updates.preferences = preferences
    if (favorite_panels) updates.favorite_panels = favorite_panels
    if (preferred_language) updates.preferred_language = preferred_language
    updates.updated_at = new Date().toISOString()
    
    const { error } = await supabase
      .from('badu_profiles')
      .update(updates)
      .eq('user_id', userId)
    
    if (error) {
      console.error('[BADU Preferences] Update failed:', error)
      return res.status(500).json({ error: 'preferences_update_failed' })
    }
    
    return res.json({ success: true, updated: Object.keys(updates) })
  } catch (error) {
    console.error('[BADU Preferences] Update error:', error)
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}

/**
 * POST /api/v1/badu/preferences/reset
 * Resets user's preferences to defaults
 */
export async function resetPreferences(req, res, userId) {
  try {
    const defaults = {
      content: {
        defaultTone: 'Professional',
        defaultPersona: 'Generic',
        defaultPlatforms: ['Facebook', 'Instagram']
      },
      pictures: {
        defaultStyle: 'modern',
        defaultProvider: 'flux'
      },
      video: {
        defaultDuration: 5,
        defaultProvider: 'runway'
      }
    }
    
    const { error } = await supabase
      .from('badu_profiles')
      .update({ 
        preferences: defaults,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (error) {
      console.error('[BADU Preferences] Reset failed:', error)
      return res.status(500).json({ error: 'preferences_reset_failed' })
    }
    
    return res.json({ success: true, preferences: defaults })
  } catch (error) {
    console.error('[BADU Preferences] Reset error:', error)
    return res.status(500).json({ error: 'internal_error', message: error.message })
  }
}
