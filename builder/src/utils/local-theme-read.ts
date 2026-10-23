import type { ThemeStateV5 } from '@/models/theme.model'
import { loadLocalThemeById } from '@/utils/local-theme-storage'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function readLocalThemeForRelay(storage: Storage, id: string, activeState?: ThemeStateV5): ThemeStateV5 | null {
  if (activeState) return cloneTheme(activeState)
  const loaded = loadLocalThemeById(storage, id)
  return loaded.error ? null : loaded.state
}
