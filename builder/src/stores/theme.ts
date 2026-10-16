import { readonly, ref } from 'vue'
import { defineStore } from 'pinia'

import type { ThemeStateV4 } from '@/models/theme.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { useThemeFoundationActions } from '@/composables/use-theme-foundation-actions'
import { useThemePaletteActions } from '@/composables/use-theme-palette-actions'
import { useThemeOverrideActions } from '@/composables/use-theme-override-actions'
import { useThemeRawActions } from '@/composables/use-theme-raw-actions'
import { useThemeIconBrandingActions } from '@/composables/use-theme-icon-branding-actions'
import { useThemeProjection } from '@/composables/use-theme-projection'
import { useThemeHistory } from '@/composables/use-theme-history'
import { useThemePersistence } from '@/composables/use-theme-persistence'
import { useThemeRecovery } from '@/composables/use-theme-recovery'

const storageKey = 'ftb-theme'
const recoveryStorageKey = 'ftb-theme-legacy-recovery'

export const useThemeStore = defineStore('theme', () => {
  const persistence = useThemePersistence(storageKey, recoveryStorageKey)
  const theme = ref<ThemeStateV4>(persistence.restore())
  const registry = createThemeRegistry()
  const history = useThemeHistory(theme, persistence.serialize, storageKey)
  const context: ThemeStoreContext = { theme, registry }
  const recovery = useThemeRecovery(theme, persistence, history.applyTheme)

  return {
    theme: readonly(theme),
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    ...useThemeFoundationActions(context),
    ...useThemePaletteActions(context),
    ...useThemeOverrideActions(context),
    ...useThemeRawActions(context),
    ...useThemeIconBrandingActions(context),
    ...useThemeProjection(context),
    ...recovery,
    undo: history.undo,
    redo: history.redo,
  }
})
