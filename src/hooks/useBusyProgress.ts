import * as React from 'react'
import { animate, useMotionValue } from 'framer-motion'

export type RunStatus = 'idle' | 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'

/**
 * Maps server statuses to a visible progress animation.
 * - Moves forward on each status hop.
 * - If status stalls, we keep a gentle creep so the outline feels alive.
 * - On ready: finish to 1.0; on error: snap to 0 and stop.
 */
export function useBusyProgress(status: RunStatus, runId?: string) {
  const mv = useMotionValue(0)
  const [progress, setProgress] = React.useState(0)
  const [key, setKey] = React.useState<string>(() => `run-${Date.now()}`)

  React.useEffect(() => mv.on('change', setProgress), [mv])

  // Restart animation whenever the gateway creates a new run
  React.useEffect(() => {
    if (!runId) return
    setKey(`run-${runId}-${Date.now()}`)
    mv.set(0.02) // tiny kick so borders show immediately
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId])

  React.useEffect(() => {
    let target = progress
    switch (status) {
      case 'queued':
        target = Math.max(progress, 0.12)
        break
      case 'thinking':
        target = Math.max(progress, 0.38)
        break
      case 'rendering':
        target = Math.max(progress, 0.78)
        break
      case 'ready':
        target = 1
        break
      case 'error':
        target = 0
        break
      default:
        target = progress
    }

    const ctrl = animate(mv, target, {
      duration: status === 'ready' ? 0.35 : 0.55,
      ease: status === 'ready' ? 'easeOut' : 'easeInOut',
    })

    // optimistic creep while we wait between SSE hops
    let raf = 0
    if (status === 'thinking' || status === 'rendering' || status === 'queued') {
      const creep = () => {
        if (mv.get() < 0.92) mv.set(mv.get() + 0.0025)
        raf = requestAnimationFrame(creep)
      }
      raf = requestAnimationFrame(creep)
    }

    return () => {
      ctrl.stop()
      if (raf) cancelAnimationFrame(raf)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const busy = status === 'queued' || status === 'thinking' || status === 'rendering'
  return { progress, busy, key }
}
