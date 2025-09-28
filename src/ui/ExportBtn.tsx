import * as React from 'react'
import { exportJSON } from '@/lib/saves'

export function ExportBtn({ payload, base = 'marketing-engine-content' }: { payload: unknown; base?: string }) {
  const handleExport = React.useCallback(() => {
    try {
      exportJSON(base, payload)
    } catch (error) {
      console.warn('Failed to export payload', error)
    }
  }, [base, payload])

  return (
    <button
      type="button"
      onClick={handleExport}
      className="px-3 h-8 rounded-xl bg-white/8 hover:bg-white/12 text-white/80 text-sm backdrop-blur-md border border-white/12"
      title="Export JSON"
    >
      Export
    </button>
  )
}
