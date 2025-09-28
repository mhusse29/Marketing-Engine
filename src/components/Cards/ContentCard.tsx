import { useEffect, useMemo, useRef, useState } from 'react'

import ContentVariantCard from '@/cards/ContentVariantCard'
import type { ContentGenerationMeta, ContentVariantResult } from '@/types'
import { useBusyProgress } from '@/hooks/useBusyProgress'
import PlatformRail from '@/ui/PlatformRail'
import { getPlatformLabel } from '@/ui/platformUtils'
import { saveRun } from '@/lib/saves'

interface ContentCardProps {
  status: string
  variants: ContentVariantResult[]
  meta?: ContentGenerationMeta | null
  error?: string
  briefText: string
  options: Record<string, unknown> & { copyLength?: string }
  platformIds: string[]
  versions: number
  runId?: string | null
  onRegenerate: (
    brief: string,
    options: Record<string, unknown>,
    versions: number,
    hint?: string
  ) => void
}

type RunStatus = 'idle' | 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'
type CardStatus = 'queued' | 'thinking' | 'rendering' | 'ready' | 'error'

const formatHashtags = (value?: string | string[] | null) => {
  if (!value) return undefined
  if (Array.isArray(value)) {
    const formatted = value
      .map((tag) => (typeof tag === 'string' ? `#${tag.replace(/^#/, '')}` : ''))
      .filter(Boolean)
      .join(' ')
    return formatted.length > 0 ? formatted : undefined
  }
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }
  return undefined
}

export default function ContentCard({
  status,
  variants,
  meta,
  error,
  briefText,
  options,
  platformIds,
  versions,
  runId,
  onRegenerate,
}: ContentCardProps) {
  const settingsPlatforms = useMemo(
    () => (Array.isArray(platformIds) ? platformIds.filter((p) => p !== 'Auto') : []),
    [platformIds]
  )

  const payloadPlatforms: string[] = meta?.platforms || settingsPlatforms || []
  const platforms = payloadPlatforms.filter(Boolean)
  const platformCounts = meta?.counts || {}

  const variantsByPlat = useMemo(() => {
    const map = new Map<string, ContentVariantResult[]>()
    for (const p of platforms) map.set(p, [])
    for (const v of variants) {
      if (v?.platform && map.has(v.platform)) map.get(v.platform)!.push(v)
    }
    return map
  }, [variants, platforms])

  const [activePlat, setActivePlat] = useState<string>(platforms[0] || 'LinkedIn')
  const [versionByPlatform, setVersionByPlatform] = useState<Record<string, number>>({})
  const cardRef = useRef<HTMLElement | null>(null)
  const isDev = Boolean(import.meta.env?.DEV)

  useEffect(() => {
    const node = cardRef.current
    if (!node || typeof ResizeObserver === 'undefined') return

    const update = () => {
      const rect = node.getBoundingClientRect()
      if (rect.height > 0) {
        node.style.setProperty('--me-card-height', `${rect.height}px`)
      }
    }

    update()
    const ro = new ResizeObserver(update)
    ro.observe(node)
    return () => {
      ro.disconnect()
      node.style.removeProperty('--me-card-height')
    }
  }, [variants.length, status, versions, activePlat])

  useEffect(() => {
    if (!platforms.length) return
    if (!platforms.includes(activePlat)) {
      setActivePlat(platforms[0])
      return
    }
    const hasForActive = (variantsByPlat.get(activePlat) || []).length > 0
    if (!hasForActive) {
      const firstWithData = platforms.find((p) => (variantsByPlat.get(p) || []).length > 0)
      if (firstWithData) setActivePlat(firstWithData)
    }
  }, [platforms, activePlat, variantsByPlat])

  const listForActive = variantsByPlat.get(activePlat) || []
  const anyData = platforms.some((p) => (variantsByPlat.get(p) || []).length > 0)
  const resultPayload = useMemo(() => ({ variants, meta }), [variants, meta])
  const runStatus = (['idle', 'queued', 'thinking', 'rendering', 'ready', 'error'].includes(status)
    ? status
    : 'idle') as RunStatus
  const metaRecord = meta as (ContentGenerationMeta & { id?: string }) | null
  const metaId = typeof metaRecord?.id === 'string' ? metaRecord.id : undefined
  const resolvedRunId =
    (typeof meta?.runId === 'string' ? meta.runId : undefined) ||
    metaId ||
    (typeof runId === 'string' ? runId : undefined)
  const { progress, key: runKey } = useBusyProgress(runStatus, resolvedRunId)
  const cardStatus: CardStatus = runStatus === 'idle' ? 'ready' : (runStatus as CardStatus)

  if (isDev && (variants.length > 0 || status === 'ready')) {
    console.log('ContentCard Debug:', {
      status,
      platforms,
      activePlat,
      variantsByPlatCount: Array.from(variantsByPlat.entries()).map(([k, v]) => [k, v.length]),
      listForActiveLength: listForActive.length,
      anyData,
      totalVariants: variants.length,
    })
  }

  const requestedIndex = versionByPlatform[activePlat] ?? 0
  const boundedIndex = listForActive.length
    ? Math.min(requestedIndex, Math.max(listForActive.length - 1, 0))
    : 0
  const candidateVariant = listForActive.length ? listForActive[boundedIndex] : null
  const displayVariant = candidateVariant &&
    typeof candidateVariant.headline === 'string' &&
    typeof candidateVariant.primary_text === 'string' &&
    typeof candidateVariant.cta_label === 'string'
      ? (candidateVariant as ContentVariantResult & {
          headline: string
          primary_text: string
          cta_label: string
        })
      : null
  const variantData = displayVariant
    ? {
        headline: displayVariant.headline,
        caption: displayVariant.primary_text,
        hashtags: displayVariant.hashtags,
      }
    : undefined
  const cardHeadline =
    typeof variantData?.headline === 'string' && variantData.headline.trim().length > 0
      ? variantData.headline
      : undefined
  const cardCaption =
    typeof variantData?.caption === 'string' && variantData.caption.trim().length > 0
      ? variantData.caption
      : undefined
  const cardHashtags = formatHashtags(variantData?.hashtags ?? null)
  const platformLabel = getPlatformLabel(displayVariant?.platform || activePlat)
  const currentVariant = {
    platform: platformLabel,
    ...(cardHeadline ? { headline: cardHeadline } : {}),
    ...(cardCaption ? { caption: cardCaption } : {}),
    ...(cardHashtags ? { hashtags: cardHashtags } : {}),
  }
  const hasReadyContent = Boolean(cardHeadline || cardCaption || cardHashtags)
  const showVersionToggle = versions === 2 && listForActive.length > 1
  const activeCount = typeof platformCounts[activePlat] === 'number' ? platformCounts[activePlat] : listForActive.length
  const showSalvageNotice = Boolean((meta?.salvaged || meta?.backfilled) && activeCount < versions)

  const selectedLabel = getPlatformLabel(activePlat)
  const canRegenerate = briefText.trim().length > 0

  const handleVersionChange = (idx: number) => {
    setVersionByPlatform((prev) => ({ ...prev, [activePlat]: idx }))
  }

  const handleRegenerate = () => {
    if (!canRegenerate) {
      console.warn('Cannot regenerate content without a brief.')
      return
    }
    onRegenerate(briefText, options, versions, `refresh ${selectedLabel}`)
  }

  const handleSave = () => {
    try {
      saveRun('content', resultPayload)
    } catch (err) {
      console.warn('Failed to save content run', err)
    }
  }

  return (
    <section className="grid grid-cols-[auto_1fr] gap-6">
      <PlatformRail
        platforms={platforms}
        selected={activePlat}
        onChange={(platform) => {
          setActivePlat(platform)
          setVersionByPlatform((prev) => ({ ...prev, [platform]: 0 }))
        }}
        targetRef={cardRef}
        btnSize={40}
        pad={8}
      />

      <div
        ref={(node) => {
          cardRef.current = node
        }}
        className="flex flex-col gap-4"
      >
        {status === 'error' && error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        ) : null}

        {showSalvageNotice ? (
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-xs text-amber-100">
            Some variants were auto-filled. Regenerate to request fresh ideas.
          </div>
        ) : null}

        {showVersionToggle ? (
          <div className="inline-flex items-center gap-2 rounded-xl bg-white/8 p-1 text-[11px] w-max">
            <button
              type="button"
              onClick={() => handleVersionChange(0)}
              className={`px-2 py-1 rounded-lg ${boundedIndex === 0 ? 'bg-white/15' : 'hover:bg-white/10'}`}
            >
              v1
            </button>
            <button
              type="button"
              onClick={() => handleVersionChange(1)}
              className={`px-2 py-1 rounded-lg ${boundedIndex === 1 ? 'bg-white/15' : 'hover:bg-white/10'}`}
            >
              v2
            </button>
          </div>
        ) : null}
        <ContentVariantCard
          key={runKey}
          status={cardStatus}
          progress={progress}
          variant={currentVariant}
          onRegenerate={handleRegenerate}
          onSave={hasReadyContent ? handleSave : undefined}
        />
      </div>
    </section>
  )
}
