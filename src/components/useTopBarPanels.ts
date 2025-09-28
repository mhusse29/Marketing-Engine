import { useCallback, useState } from 'react'

import type { TopBarPanelTab } from './TopBarPanels.helpers'

type PanelsHook = {
  open: TopBarPanelTab | null
  toggle: (tab: TopBarPanelTab) => void
  close: () => void
}

export function useTopBarPanels(): PanelsHook {
  const [open, setOpen] = useState<TopBarPanelTab | null>(null)

  const toggle = useCallback((tab: TopBarPanelTab) => {
    setOpen((prev) => (prev === tab ? null : tab))
  }, [])

  const close = useCallback(() => {
    setOpen(null)
  }, [])

  return { open, toggle, close }
}
