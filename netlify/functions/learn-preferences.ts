/**
 * BADU Preference Learning Edge Function
 * Analyzes recent user behavior and updates preferences automatically
 * Schedule: Run hourly via Netlify Scheduled Functions
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('VITE_SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
)

interface PreferenceLearning {
  userId: string
  contentDefaults: {
    tone?: string
    persona?: string
    platforms?: string[]
  }
  picturesDefaults: {
    provider?: string
    style?: string
  }
  videoDefaults: {
    provider?: string
    duration?: number
  }
  confidence: number
}

/**
 * Analyze user's recent activity and extract patterns
 */
async function analyzeUserBehavior(userId: string): Promise<PreferenceLearning | null> {
  try {
    // Get last 30 days of messages
    const { data: messages, error: messagesError } = await supabase
      .from('badu_messages')
      .select('detected_panel, structured_response, created_at')
      .eq('user_id', userId)
      .eq('role', 'assistant')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(100)
    
    if (messagesError || !messages || messages.length < 5) {
      return null // Not enough data
    }
    
    // Get positive feedback
    const { data: feedback } = await supabase
      .from('badu_feedback')
      .select('message_id, rating')
      .eq('user_id', userId)
      .gte('rating', 4)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    const positiveMessageIds = new Set((feedback || []).map(f => f.message_id))
    
    // Analyze content preferences
    const contentMessages = messages.filter(m => m.detected_panel === 'content')
    const contentDefaults: any = {}
    
    if (contentMessages.length >= 3) {
      const tones: Record<string, number> = {}
      const personas: Record<string, number> = {}
      const platforms: Record<string, number> = {}
      
      contentMessages.forEach(msg => {
        const response = msg.structured_response
        const weight = positiveMessageIds.has(msg.id as any) ? 2 : 1
        
        if (response?.tone) {
          tones[response.tone] = (tones[response.tone] || 0) + weight
        }
        if (response?.persona) {
          personas[response.persona] = (personas[response.persona] || 0) + weight
        }
        if (response?.platforms) {
          response.platforms.forEach((p: string) => {
            platforms[p] = (platforms[p] || 0) + weight
          })
        }
      })
      
      const topTone = Object.keys(tones).sort((a, b) => tones[b] - tones[a])[0]
      const topPersona = Object.keys(personas).sort((a, b) => personas[b] - personas[a])[0]
      const topPlatforms = Object.keys(platforms)
        .sort((a, b) => platforms[b] - platforms[a])
        .slice(0, 3)
      
      if (topTone) contentDefaults.defaultTone = topTone
      if (topPersona) contentDefaults.defaultPersona = topPersona
      if (topPlatforms.length > 0) contentDefaults.defaultPlatforms = topPlatforms
    }
    
    // Analyze pictures preferences
    const pictureMessages = messages.filter(m => m.detected_panel === 'pictures')
    const picturesDefaults: any = {}
    
    if (pictureMessages.length >= 3) {
      const providers: Record<string, number> = {}
      const styles: Record<string, number> = {}
      
      pictureMessages.forEach(msg => {
        const response = msg.structured_response
        const weight = positiveMessageIds.has(msg.id as any) ? 2 : 1
        
        if (response?.provider) {
          providers[response.provider] = (providers[response.provider] || 0) + weight
        }
        if (response?.style) {
          styles[response.style] = (styles[response.style] || 0) + weight
        }
      })
      
      const topProvider = Object.keys(providers).sort((a, b) => providers[b] - providers[a])[0]
      const topStyle = Object.keys(styles).sort((a, b) => styles[b] - styles[a])[0]
      
      if (topProvider) picturesDefaults.defaultProvider = topProvider
      if (topStyle) picturesDefaults.defaultStyle = topStyle
    }
    
    // Analyze video preferences
    const videoMessages = messages.filter(m => m.detected_panel === 'video')
    const videoDefaults: any = {}
    
    if (videoMessages.length >= 3) {
      const providers: Record<string, number> = {}
      const durations: number[] = []
      
      videoMessages.forEach(msg => {
        const response = msg.structured_response
        const weight = positiveMessageIds.has(msg.id as any) ? 2 : 1
        
        if (response?.provider) {
          providers[response.provider] = (providers[response.provider] || 0) + weight
        }
        if (response?.duration) {
          durations.push(response.duration)
        }
      })
      
      const topProvider = Object.keys(providers).sort((a, b) => providers[b] - providers[a])[0]
      const avgDuration = durations.length > 0 
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : null
      
      if (topProvider) videoDefaults.defaultProvider = topProvider
      if (avgDuration) videoDefaults.defaultDuration = avgDuration
    }
    
    // Calculate confidence based on data volume
    const totalMessages = messages.length
    const confidence = Math.min(0.95, 0.5 + (totalMessages / 100) * 0.45)
    
    return {
      userId,
      contentDefaults,
      picturesDefaults,
      videoDefaults,
      confidence
    }
  } catch (error) {
    console.error('Behavior analysis failed:', error)
    return null
  }
}

/**
 * Update user preferences in badu_profiles
 */
async function updatePreferences(learning: PreferenceLearning): Promise<boolean> {
  try {
    // Get current preferences
    const { data: profile } = await supabase
      .from('badu_profiles')
      .select('preferences')
      .eq('user_id', learning.userId)
      .single()
    
    if (!profile) return false
    
    const currentPrefs = profile.preferences || {}
    
    // Merge learned preferences with existing
    const updatedPrefs = {
      ...currentPrefs,
      content: {
        ...currentPrefs.content,
        ...learning.contentDefaults
      },
      pictures: {
        ...currentPrefs.pictures,
        ...learning.picturesDefaults
      },
      video: {
        ...currentPrefs.video,
        ...learning.videoDefaults
      },
      _learned: {
        lastUpdate: new Date().toISOString(),
        confidence: learning.confidence
      }
    }
    
    // Update profile
    const { error } = await supabase
      .from('badu_profiles')
      .update({
        preferences: updatedPrefs,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', learning.userId)
    
    if (error) {
      console.error('Preference update failed:', error)
      return false
    }
    
    console.log(`Updated preferences for user ${learning.userId} (confidence: ${learning.confidence})`)
    return true
  } catch (error) {
    console.error('Update failed:', error)
    return false
  }
}

/**
 * Main handler - runs for all active users
 */
export default async function handler() {
  const startTime = Date.now()
  
  try {
    // Get users active in last 7 days
    const { data: activeUsers, error } = await supabase
      .from('badu_sessions')
      .select('user_id')
      .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('updated_at', { ascending: false })
    
    if (error || !activeUsers) {
      return new Response(JSON.stringify({ error: 'Failed to fetch active users' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Deduplicate user IDs
    const uniqueUserIds = Array.from(new Set(activeUsers.map(s => s.user_id)))
    console.log(`Processing ${uniqueUserIds.length} active users`)
    
    let updated = 0
    let skipped = 0
    
    // Process each user
    for (const userId of uniqueUserIds) {
      const learning = await analyzeUserBehavior(userId)
      
      if (learning && learning.confidence > 0.6) {
        const success = await updatePreferences(learning)
        if (success) updated++
      } else {
        skipped++
      }
      
      // Rate limit: sleep between users
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const duration = Date.now() - startTime
    
    return new Response(JSON.stringify({
      success: true,
      processed: uniqueUserIds.length,
      updated,
      skipped,
      duration_ms: duration
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Preference learning job failed:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
