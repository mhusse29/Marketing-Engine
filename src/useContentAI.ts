import { useState } from 'react'
import type { ContentGenerationMeta, ContentVariantResult } from './types'

const API_BASE: string = ((import.meta.env?.VITE_API_BASE as string | undefined) ?? 'http://localhost:8787').replace(/\/$/, '')
const EVENTS_PATH: string = (import.meta.env?.VITE_EVENTS_PATH as string | undefined) ?? '/events'
const EVENTS_PATH_NORMALIZED = EVENTS_PATH.startsWith('/') ? EVENTS_PATH : `/${EVENTS_PATH}`

function buildEventsUrl(runId: string) {
  return `${API_BASE}${EVENTS_PATH_NORMALIZED}?runId=${encodeURIComponent(runId)}`
}

type ContentAIStatus = 'idle' | 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'

type ContentAIResult = {
  variants?: ContentVariantResult[]
  meta?: ContentGenerationMeta
  [key: string]: unknown
}

type ContentAIOptions = Record<string, unknown>

type ExtraRunOptions = {
  regen?: boolean
  regenHint?: string
}

function waitForContentCompletion(
  runId: string,
  signal?: AbortSignal,
  onStatus?: (status: ContentAIStatus) => void
) {
  return new Promise<ContentAIResult | null>((resolve, reject) => {
    const es = new EventSource(buildEventsUrl(runId))

    const cleanup = () => {
      try {
        es.close()
      } catch {
        /* noop */
      }
      if (signal) {
        signal.removeEventListener('abort', onAbort)
      }
    }

    const kill = (error?: Error) => {
      cleanup()
      if (error) {
        reject(error)
      }
    }

    const onAbort = () => kill(new Error('aborted'))

    es.onmessage = (evt) => {
      if (!evt?.data || evt.data[0] !== '{') return
      let obj: Record<string, unknown>
      try {
        obj = JSON.parse(evt.data)
      } catch {
        return
      }

      if (obj.id && obj.id !== runId) return
      if (obj.type === 'ping') return

      if (obj.status) {
        onStatus?.(obj.status as ContentAIStatus)
      }

      if (obj.status === 'ready') {
        cleanup()
        resolve((obj.payload ?? null) as ContentAIResult | null)
        return
      }

      if (obj.status === 'error') {
        kill(new Error((obj.error as string) || 'provider_error'))
        return
      }
    }

    es.onerror = () => kill(new Error('sse_error'))

    if (signal) {
      signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}

export function useContentAI() {
  const [status, setStatus] = useState<ContentAIStatus>('idle')
  const [result, setResult] = useState<ContentAIResult | null>(null)
  const [error, setError] = useState<string | undefined>()
  const [currentRunId, setCurrentRunId] = useState<string | null>(null)

  async function run(
    brief: string,
    options: ContentAIOptions,
    versions = 2,
    extra: ExtraRunOptions = {}
  ) {
    setStatus('queued')
    setResult(null)
    setError(undefined)

    const payload = {
      brief,
      options,
      versions,
      regen: Boolean(extra.regen),
      regenHint: extra.regenHint,
      nonce: Date.now(),
    }

    const response = await fetch(`${API_BASE}/v1/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway response error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`AI Gateway error (${response.status}): ${errorText}`);
    }

    let responseData;
    try {
      responseData = await response.json();
    } catch (jsonError) {
      const responseText = await response.text();
      console.error('Failed to parse AI Gateway response as JSON:', {
        error: jsonError,
        responseText: responseText,
        contentType: response.headers.get('content-type')
      });
      throw new Error(`Invalid JSON response from AI Gateway: ${responseText}`);
    }

    const { runId } = responseData as { runId: string }
    setCurrentRunId(runId)

    try {
      const payload = await waitForContentCompletion(runId, undefined, (nextStatus) => {
        if (nextStatus) {
          setStatus(nextStatus)
        }
      })

      if (payload) {
        if (import.meta.env?.DEV) {
          console.log('[useContentAI] received payload', payload)
        }
        setResult(payload)
      } else {
        setResult(null)
      }
      setError(undefined)
      setStatus('ready')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'provider_error'
      setError(message)
      setStatus('error')
    }
  }

  const regenerate = (
    brief: string,
    options: ContentAIOptions,
    versions = 2,
    hint?: string
  ) => run(brief, options, versions, { regen: true, regenHint: hint })

  return { status, result, error, run, regenerate, runId: currentRunId }
}
