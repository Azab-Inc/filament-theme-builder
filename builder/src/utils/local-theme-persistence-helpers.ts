import type { LocalThemeHistory } from '@/models/local-theme.model'
import type { ThemeStateV4 } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function cloneLocalThemeHistory(history: LocalThemeHistory): LocalThemeHistory {
  return { snapshots: history.snapshots.map(cloneTheme), cursor: history.cursor }
}

export function localThemeStorageMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Local theme storage failed'
}

export function cloneLocalThemeState(state: ThemeStateV4): ThemeStateV4 {
  return cloneTheme(state)
}

export function createDefaultLocalTheme(): { state: ThemeStateV4; history: LocalThemeHistory } {
  const state = createDefaultThemeState()
  return { state, history: { snapshots: [cloneTheme(state)], cursor: 0 } }
}
