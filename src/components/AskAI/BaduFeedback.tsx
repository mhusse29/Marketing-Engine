/**
 * BADU Feedback Component
 * Inline feedback capture with thumbs up/down and reason tags
 */

import { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const GATEWAY_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

const REASON_TAGS = {
  positive: [
    'accurate',
    'helpful',
    'clear',
    'fast',
    'comprehensive'
  ],
  negative: [
    'inaccurate',
    'incomplete',
    'unclear',
    'slow',
    'off_topic'
  ]
}

interface BaduFeedbackProps {
  messageId: string
  onFeedbackSubmitted?: () => void
}

export function BaduFeedback({ messageId, onFeedbackSubmitted }: BaduFeedbackProps) {
  const [rating, setRating] = useState<number | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleRating = async (newRating: number) => {
    setRating(newRating)
    setShowDetails(true)

    // If thumbs up and no need for details, submit immediately
    if (newRating === 1 && selectedTags.length === 0) {
      await submitFeedback(newRating, [], '')
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const submitFeedback = async (
    finalRating: number,
    tags: string[],
    text: string
  ) => {
    try {
      setIsSubmitting(true)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('No session token available')
      }

      const response = await fetch(`${GATEWAY_URL}/api/v1/badu/feedback`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_id: messageId,
          rating: finalRating,
          reason_tags: tags,
          free_text: text || undefined
        })
      })

      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }

      setSubmitted(true)
      setShowDetails(false)
      onFeedbackSubmitted?.()
    } catch (error) {
      console.error('[BADU Feedback] Submit error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitDetails = () => {
    if (rating !== null) {
      submitFeedback(rating, selectedTags, freeText)
    }
  }

  if (submitted) {
    return (
      <div className="text-sm text-green-400 mt-2">
        ✓ Thanks for your feedback!
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      {/* Thumbs buttons */}
      {rating === null && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Was this helpful?</span>
          <button
            onClick={() => handleRating(1)}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            title="Thumbs up"
          >
            <ThumbsUp className="w-4 h-4 text-gray-400 hover:text-green-400" />
          </button>
          <button
            onClick={() => handleRating(-1)}
            className="p-1.5 rounded hover:bg-white/5 transition-colors"
            title="Thumbs down"
          >
            <ThumbsDown className="w-4 h-4 text-gray-400 hover:text-red-400" />
          </button>
        </div>
      )}

      {/* Detailed feedback */}
      {showDetails && (
        <div className="bg-white/5 rounded-lg p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="text-xs font-medium text-gray-300">
            Tell us more:
          </div>

          {/* Reason tags */}
          <div className="flex flex-wrap gap-1.5">
            {(rating === 1 ? REASON_TAGS.positive : REASON_TAGS.negative).map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {tag.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Free text (optional) */}
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Additional comments (optional)"
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded text-xs text-white placeholder-gray-500 resize-none focus:outline-none focus:border-cyan-500/50"
            rows={2}
          />

          {/* Submit button */}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDetails(false)}
              className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitDetails}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
