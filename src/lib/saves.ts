export type SaveKind = 'content' | 'pictures' | 'video'

const ROOT = 'me.saves.v1'

type SaveEntry = {
  id: string
  kind: SaveKind
  createdAt: number
  meta: Record<string, unknown>
  payload: unknown
}

function bucket(kind: SaveKind) {
  return `${ROOT}:${kind}`
}

function read(kind: SaveKind): SaveEntry[] {
  try {
    const raw = localStorage.getItem(bucket(kind))
    return raw ? (JSON.parse(raw) as SaveEntry[]) : []
  } catch {
    return []
  }
}

function write(kind: SaveKind, list: SaveEntry[]) {
  localStorage.setItem(bucket(kind), JSON.stringify(list))
}

export function saveRun(kind: SaveKind, payload: unknown): string {
  const id = crypto.randomUUID()
  const meta = {
    model: (payload as Record<string, unknown>)?.meta?.model,
    platforms: (payload as Record<string, unknown>)?.meta?.platforms,
    versions: (payload as Record<string, unknown>)?.meta?.versions,
    salvaged: (payload as Record<string, unknown>)?.meta?.salvaged || false,
    backfilled: (payload as Record<string, unknown>)?.meta?.backfilled || false,
  }
  const entry: SaveEntry = { id, kind, createdAt: Date.now(), meta, payload }
  const list = read(kind)
  list.unshift(entry)
  write(kind, list.slice(0, 200))
  return id
}

export function listSaves(kind: SaveKind): SaveEntry[] {
  return read(kind)
}

export function loadSave(kind: SaveKind, id: string): SaveEntry | undefined {
  return read(kind).find((entry) => entry.id === id)
}

export function exportJSON(filenameBase: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  a.download = `${filenameBase}-${ts}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
