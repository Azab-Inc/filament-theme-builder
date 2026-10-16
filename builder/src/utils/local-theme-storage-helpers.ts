import type { LocalThemeLoadResult } from '@/models/local-theme.model'
import type { ThemeState, ThemeStateV4 } from '@/models/theme.model'

export function parseStorageJson(value: string | null): unknown {
  try { return value === null ? null : JSON.parse(value) as unknown } catch { return null }
}

export function isThemeValue(value: unknown): value is ThemeState {
  return typeof value === 'object' && value !== null && 'schemaVersion' in value
}

export function storageErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Local theme storage failed'
}

export function failedLocalThemeLoad(state: ThemeStateV4, error: string): LocalThemeLoadResult {
  return { collection: { themes: [], activeId: '' }, state, history: { snapshots: [state], cursor: 0 }, error }
}

export function hasNewFormatRemnants(storage: Storage): boolean {
  if (storage.getItem('ftb-theme-active') !== null) return true
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (key?.startsWith('ftb-theme:') || key?.startsWith('ftb-theme-history:')) return true
  }
  return false
}
