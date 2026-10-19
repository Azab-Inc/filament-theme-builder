import type { ThemeStateV4 } from '@/models/theme.model'
import { loadLocalThemeById } from '@/utils/local-theme-storage'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function readLocalThemeForRelay(storage: Storage, id: string, activeState?: ThemeStateV4): ThemeStateV4 | null {
  if (activeState) return cloneTheme(activeState)
  const loaded = loadLocalThemeById(storage, id)
  return loaded.error ? null : loaded.state
}
