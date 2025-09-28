import * as React from 'react'
import { saveRun } from '@/lib/saves'

export function SaveBtn({ kind = 'content', payload }: { kind?: 'content' | 'pictures' | 'video'; payload: unknown }) {
  const handleClick = React.useCallback(() => {
    try {
      const id = saveRun(kind, payload)
      console.info(`Saved ${kind} run → ${id}`)
    } catch (error) {
      console.warn('Failed to save run', error)
    }
  }, [kind, payload])

  return (
    <button
      type="button"
      onClick={handleClick}
      className="px-3 h-8 rounded-xl bg-white/10 hover:bg-white/14 text-white/90 text-sm backdrop-blur-md border border-white/12"
    >
      Save
    </button>
  )
}
