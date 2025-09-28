import { useLayoutEffect, useRef, type RefObject } from 'react'
import { motion, useMotionValue } from 'framer-motion'

import PlatformPill from '@/ui/PlatformPill'

type PlatformRailProps = {
  platforms: string[]
  selected: string
  onChange: (platform: string) => void
  targetRef: RefObject<HTMLElement | null>
  btnSize?: number
  pad?: number
}

export default function PlatformRail({
  platforms,
  selected,
  onChange,
  targetRef,
  btnSize = 40,
  pad = 8,
}: PlatformRailProps) {
  const heightMV = useMotionValue<number>(btnSize * platforms.length + pad * 2)
  const gapMV = useMotionValue<number>(12)
  const roRef = useRef<ResizeObserver | null>(null)

  useLayoutEffect(() => {
    if (!targetRef?.current) return
    const el = targetRef.current

    const recalc = () => {
      const rect = el.getBoundingClientRect()
      const h = rect.height || 0
      const count = Math.max(1, platforms.length)
      const minHeight = count * btnSize + pad * 2
      const clampedHeight = Math.max(h, minHeight)
      const available = Math.max(0, clampedHeight - pad * 2 - count * btnSize)
      const nextGap = count > 1 ? available / (count - 1) : 0
      const gap = Math.max(8, Math.min(32, nextGap))
      heightMV.set(clampedHeight)
      gapMV.set(gap)
    }

    roRef.current?.disconnect()
    const ro = new ResizeObserver(() => requestAnimationFrame(recalc))
    ro.observe(el)
    roRef.current = ro
    recalc()

    return () => ro.disconnect()
  }, [targetRef, platforms.length, btnSize, pad, selected, heightMV, gapMV])

  return (
    <motion.div
      aria-label="platform rail"
      className="pr-4 flex flex-col items-start"
      style={{ height: heightMV, gap: gapMV }}
    >
      {platforms.map((platform) => (
        <motion.div key={platform} layout>
          <PlatformPill
            name={platform}
            selected={selected === platform}
            onClick={() => onChange(platform)}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
