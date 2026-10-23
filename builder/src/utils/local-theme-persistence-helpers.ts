import type { LocalThemeHistory } from '@/models/local-theme.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function cloneLocalThemeHistory(history: LocalThemeHistory): LocalThemeHistory {
  return { snapshots: history.snapshots.map(cloneTheme), cursor: history.cursor }
}

export function localThemeStorageMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Local theme storage failed'
}

export function cloneLocalThemeState(state: ThemeStateV5): ThemeStateV5 {
  return cloneTheme(state)
}

export function createDefaultLocalTheme(): { state: ThemeStateV5; history: LocalThemeHistory } {
  const state = createDefaultCurrentThemeState()
  return { state, history: { snapshots: [cloneTheme(state)], cursor: 0 } }
}
