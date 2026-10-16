import type { LocalThemeHistory, LocalThemeRecord } from '@/models/local-theme.model'
import type { ThemeStateV4 } from '@/models/theme.model'

const LOCAL_THEME_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/

export function isSafeLocalThemeId(value: unknown): value is string {
  return typeof value === 'string' && LOCAL_THEME_ID_PATTERN.test(value)
}

export function parseLocalThemeCollection(value: unknown): LocalThemeRecord[] | null {
  if (!Array.isArray(value)) return null
  const ids = new Set<string>()
  const records: LocalThemeRecord[] = []

  for (const entry of value) {
    if (!isRecord(entry) || !isSafeLocalThemeId(entry.id) || ids.has(entry.id)) return null
    if (typeof entry.name !== 'string' || entry.name.trim().length === 0) return null
    if (typeof entry.updatedAt !== 'number' || !Number.isFinite(entry.updatedAt) || entry.updatedAt < 0) return null
    ids.add(entry.id)
    records.push({ id: entry.id, name: entry.name, updatedAt: entry.updatedAt })
  }

  return records
}

export function parseLocalThemeHistory(
  value: unknown,
  validateState: (value: unknown) => ThemeStateV4 | null,
): LocalThemeHistory | null {
  if (!isRecord(value) || !Array.isArray(value.snapshots) || value.snapshots.length === 0) return null
  const cursor = value.cursor
  if (typeof cursor !== 'number' || !Number.isInteger(cursor) || cursor < 0 || cursor >= value.snapshots.length) return null
  const snapshots: ThemeStateV4[] = []
  for (const snapshot of value.snapshots) {
    const validated = validateState(snapshot)
    if (!validated) return null
    snapshots.push(validated)
  }
  return { snapshots, cursor }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
