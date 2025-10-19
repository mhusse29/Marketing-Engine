import { useCallback, useState, useRef } from 'react'

import type { TopBarPanelTab } from './TopBarPanels.helpers'

type PanelsHook = {
  open: TopBarPanelTab | null
  toggle: (tab: TopBarPanelTab) => void
  close: () => void
  openPanel: (tab: TopBarPanelTab) => void
  setHovering: (isHovering: boolean) => void
}

export function useTopBarPanels(): PanelsHook {
  const [open, setOpen] = useState<TopBarPanelTab | null>(null)
  const [isHovering, setIsHovering] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const toggle = useCallback((tab: TopBarPanelTab) => {
    setOpen((prev) => (prev === tab ? null : tab))
  }, [])

  const close = useCallback(() => {
    setOpen(null)
  }, [])

  const openPanel = useCallback((tab: TopBarPanelTab) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
      hoverTimeoutRef.current = null
    }
    setOpen(tab)
  }, [])

  const setHovering = useCallback((hovering: boolean) => {
    setIsHovering(hovering)
    
    if (!hovering && open) {
      // Add a delay before closing when mouse leaves
      hoverTimeoutRef.current = setTimeout(() => {
        if (!isHovering) {
          setOpen(null)
        }
      }, 150) // 150ms delay to prevent accidental closes
    }
  }, [open, isHovering])

  return { open, toggle, close, openPanel, setHovering }
}
