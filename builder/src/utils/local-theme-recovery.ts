import type { LocalThemeHistory, LocalThemeRecord, LocalThemeRecoveredRecords, StorageOperationResult } from '@/models/local-theme.model'
import type { ThemeStateV4 } from '@/models/theme.model'
import { isSafeLocalThemeId, parseLocalThemeCollection, parseLocalThemeHistory } from '@/utils/local-theme-validation'

export function recoverLocalThemeRecords(
  storage: Storage,
  indexed: LocalThemeRecord[],
  validateState: (value: unknown) => ThemeStateV4 | null,
  repair: (id: string, state: ThemeStateV4, history: LocalThemeHistory) => StorageOperationResult,
): LocalThemeRecoveredRecords {
  const metadata = new Map(indexed.map((theme) => [theme.id, theme]))
  const ids = new Set(metadata.keys())
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (key?.startsWith('ftb-theme:')) {
      const id = key.slice('ftb-theme:'.length)
      if (isSafeLocalThemeId(id)) ids.add(id)
    }
  }
  const records: LocalThemeRecord[] = []
  const values = new Map<string, { state: ThemeStateV4; history: LocalThemeHistory }>()
  let repaired = false
  let repairError: string | null = null
  for (const id of ids) {
    const state = validateState(readJson(storage.getItem(`ftb-theme:${id}`)))
    if (!state) continue
    const parsedHistory = parseLocalThemeHistory(readJson(storage.getItem(`ftb-theme-history:${id}`)), validateState)
    const history = parsedHistory ?? { snapshots: [state], cursor: 0 }
    if (!parsedHistory) {
      const result = repair(id, state, history)
      if (result.ok) repaired = true
      else repairError ??= result.error
    }
    values.set(id, { state, history })
    records.push(metadata.get(id) ?? { id, name: 'Untitled', updatedAt: Date.now() })
  }
  repaired ||= indexed.length !== records.length
  records.sort((left, right) => indexed.length
    ? indexed.findIndex((theme) => theme.id === left.id) - indexed.findIndex((theme) => theme.id === right.id)
    : left.updatedAt - right.updatedAt)
  return { records, values, repaired, repairError }
}

function readJson(value: string | null): unknown {
  try { return value === null ? null : JSON.parse(value) as unknown } catch { return null }
}

export function parseIndex(value: string | null): LocalThemeRecord[] | null {
  try { return parseLocalThemeCollection(value === null ? null : JSON.parse(value) as unknown) } catch { return null }
}
