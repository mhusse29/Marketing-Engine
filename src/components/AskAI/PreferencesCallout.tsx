/**
 * Callout component showing BADU's learned user preferences
 */

import { Brain, Settings } from 'lucide-react'
import { motion } from 'framer-motion'

interface PreferencesCalloutProps {
  preferences: {
    content?: {
      defaultTone?: string
      defaultPersona?: string
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
  conversationCount?: number
  onOverride?: () => void
  className?: string
}

export function PreferencesCallout({
  preferences,
  conversationCount = 0,
  onOverride,
  className = '',
}: PreferencesCalloutProps) {
  // Don't show if no preferences
  const hasPreferences = 
    preferences.content || 
    preferences.pictures || 
    preferences.video

  if (!hasPreferences) return null

  const items: string[] = []

  if (preferences.content?.defaultTone) {
    items.push(`You prefer ${preferences.content.defaultTone} tone`)
  }
  if (preferences.content?.defaultPersona) {
    items.push(`Default persona: ${preferences.content.defaultPersona}`)
  }
  if (preferences.pictures?.defaultProvider) {
    items.push(`Image provider: ${preferences.pictures.defaultProvider}`)
  }
  if (preferences.pictures?.defaultStyle) {
    items.push(`Image style: ${preferences.pictures.defaultStyle}`)
  }
  if (preferences.video?.defaultProvider) {
    items.push(`Video provider: ${preferences.video.defaultProvider}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`rounded-lg border-l-4 border-purple-400/50 bg-purple-900/10 p-4 backdrop-blur-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <Brain className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-purple-100 mb-1.5 flex items-center gap-2">
            BADU Remembers Your Preferences
            {conversationCount > 0 && (
              <span className="text-xs font-normal text-purple-300/60">
                ({conversationCount} conversations)
              </span>
            )}
          </h4>
          
          {items.length > 0 && (
            <ul className="space-y-1 mb-3">
              {items.map((item, idx) => (
                <li key={idx} className="text-xs text-purple-200/80 flex items-start gap-1.5">
                  <span className="text-purple-400 mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          {onOverride && (
            <button
              onClick={onOverride}
              className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-purple-100 transition-colors"
            >
              <Settings className="h-3 w-3" />
              Override for this session
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
