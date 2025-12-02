/**
 * React hook for BADU SSE streaming
 * Handles Server-Sent Events for real-time response streaming
 */

import { useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getApiBase } from '../lib/api'

interface StreamMetadata {
  type: 'meta'
  panel: string
  schema: string
  model: string
  chunks: string[]
  scores: number[]
  retrieval_ms: number
  confidence: number
  smartDefaults?: {
    provider: string
    confidence: number
  }
  templates?: Array<{
    name: string
    ctr: number
  }>
  conversationContext: {
    messageCount: number
    mostUsedPanel: string
  }
}

interface StreamToken {
  type: 'token'
  content: string
}

interface StreamTitle {
  type: 'title'
  content: string
}

interface StreamDone {
  type: 'done'
}

type StreamEvent = StreamMetadata | StreamToken | StreamTitle | StreamDone

interface UseBaduStreamOptions {
  onMetadata?: (metadata: StreamMetadata) => void
  onToken?: (token: string) => void
  onTitle?: (title: string) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

interface UseBaduStreamReturn {
  startStream: (message: string, history: any[], attachments?: any[], skipPreferences?: boolean) => Promise<void>
  stopStream: () => void
  isStreaming: boolean
  streamedText: string
  metadata: StreamMetadata | null
  error: Error | null
}

export function useBaduStream(options: UseBaduStreamOptions = {}): UseBaduStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamedText, setStreamedText] = useState('')
  const [metadata, setMetadata] = useState<StreamMetadata | null>(null)
  const [error, setError] = useState<Error | null>(null)
  
  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const streamedTextRef = useRef<string>('') // Track accumulated text

  const stopStream = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsStreaming(false)
  }, [])

  const startStream = useCallback(async (
    message: string,
    history: any[],
    attachments?: any[],
    skipPreferences?: boolean
  ) => {
    try {
      // Clean up any existing stream
      stopStream()
      
      // Reset state
      setStreamedText('')
      streamedTextRef.current = ''
      setMetadata(null)
      setError(null)
      setIsStreaming(true)

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        throw new Error('Not authenticated')
      }

      // Create abort controller for timeout
      abortControllerRef.current = new AbortController()
      const timeoutId = setTimeout(() => {
        abortControllerRef.current?.abort()
      }, 90000) // 90s timeout

      // Make POST request to initiate stream
      const response = await fetch(`${getApiBase()}/v1/chat/enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...(skipPreferences && { 'X-Skip-Preferences': 'true' }),
        },
        body: JSON.stringify({
          message,
          history: history.slice(-10),
          attachments,
          stream: true, // Request streaming
        }),
        signal: abortControllerRef.current.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // Check if response is SSE
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('text/event-stream')) {
        // Fallback to non-streaming response
        const data = await response.json()
        setStreamedText(JSON.stringify(data.response, null, 2))
        setIsStreaming(false)
        options.onComplete?.(JSON.stringify(data.response))
        return
      }

      // Parse SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          setIsStreaming(false)
          break
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          try {
            const data = JSON.parse(line.slice(6)) as StreamEvent

            switch (data.type) {
              case 'meta':
                setMetadata(data)
                options.onMetadata?.(data)
                break

              case 'token':
                streamedTextRef.current += data.content
                setStreamedText(streamedTextRef.current)
                options.onToken?.(data.content)
                break

              case 'title':
                options.onTitle?.(data.content)
                break

              case 'done':
                setIsStreaming(false)
                // Use response from done event if provided, otherwise use accumulated text
                const finalText = (data as any).response || streamedTextRef.current
                options.onComplete?.(finalText)
                break
            }
          } catch (parseError) {
            console.warn('[BADU Stream] Failed to parse SSE event:', line, parseError)
          }
        }
      }

    } catch (err) {
      console.error('[BADU Stream] Error:', err)
      const streamError = err instanceof Error ? err : new Error('Stream failed')
      setError(streamError)
      setIsStreaming(false)
      options.onError?.(streamError)
    }
  }, [options, stopStream])

  return {
    startStream,
    stopStream,
    isStreaming,
    streamedText,
    metadata,
    error,
  }
}
