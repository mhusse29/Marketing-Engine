import { PLATFORMS, type PlatformId } from '@/components/platforms/platforms'

const LABEL_TO_ID = new Map<string, PlatformId>(
  Object.entries(PLATFORMS).map(([id, def]) => [def.label.toLowerCase(), id as PlatformId])
)

export function getPlatformId(name: string): PlatformId | null {
  const lower = name.toLowerCase()
  if (lower in PLATFORMS) {
    return lower as PlatformId
  }
  return LABEL_TO_ID.get(lower) ?? null
}

export function getPlatformLabel(name: string): string {
  const id = getPlatformId(name)
  if (id) {
    return PLATFORMS[id].label
  }
  return name
}

export function getPlatformIcon(name: string) {
  const id = getPlatformId(name)
  return id ? PLATFORMS[id].Icon : null
}
