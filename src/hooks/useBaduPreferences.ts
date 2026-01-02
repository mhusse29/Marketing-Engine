/**
 * React hook for BADU user preferences
 * Fetches and manages user's BADU preferences and soft defaults
 */

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface BaduPreferences {
  content?: {
    defaultPersona?: string
    defaultTone?: string
    defaultPlatforms?: string[]
  }
  pictures?: {
    defaultProvider?: string
    defaultStyle?: string
  }
  video?: {
    defaultProvider?: string
    defaultDuration?: number
  }
}

interface PreferenceVector {
  favorite_panels?: string[]
  preferred_schemas?: string[]
  stored_preferences?: BaduPreferences
  computed_weights?: Record<string, number>
}

interface UseBaduPreferencesReturn {
  preferences: BaduPreferences
  preferenceVector: PreferenceVector
  favoritePanels: string[]
  tier: string
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  updatePreferences: (updates: Partial<BaduPreferences>) => Promise<void>
}

const GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export function useBaduPreferences(): UseBaduPreferencesReturn {
  const { user } = useAuth()
  const [preferences, setPreferences] = useState<BaduPreferences>({})
  const [preferenceVector, setPreferenceVector] = useState<PreferenceVector>({})
  const [favoritePanels, setFavoritePanels] = useState<string[]>([])
  const [tier, setTier] = useState<string>('demo')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPreferences = async () => {
    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session token available')
      }

      const response = await fetch(`${GATEWAY_URL}/api/v1/badu/preferences`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      
      setPreferences(data.preferences || {})
      setPreferenceVector(data.preference_vector || {})
      setFavoritePanels(data.favorite_panels || [])
      setTier(data.tier || 'demo')
    } catch (err) {
      console.error('[BADU Preferences] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<BaduPreferences>) => {
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session token available')
      }

      const response = await fetch(`${GATEWAY_URL}/api/v1/badu/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preferences: {
            ...preferences,
            ...updates
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const data = await response.json()
      setPreferences(data.preferences || {})
      setFavoritePanels(data.favorite_panels || [])
    } catch (err) {
      console.error('[BADU Preferences] Update error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }

  useEffect(() => {
    fetchPreferences()
  }, [user])

  return {
    preferences,
    preferenceVector,
    favoritePanels,
    tier,
    isLoading,
    error,
    refresh: fetchPreferences,
    updatePreferences
  }
}
