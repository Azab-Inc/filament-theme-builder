import { computed, readonly } from 'vue'
import { defineStore } from 'pinia'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { useThemeFoundationActions } from '@/composables/use-theme-foundation-actions'
import { useThemePaletteActions } from '@/composables/use-theme-palette-actions'
import { useThemeOverrideActions } from '@/composables/use-theme-override-actions'
import { useThemePaddingActions } from '@/composables/use-theme-padding-actions'
import { useThemeRawActions } from '@/composables/use-theme-raw-actions'
import { useThemeIconBrandingActions } from '@/composables/use-theme-icon-branding-actions'
import { useThemeProjection } from '@/composables/use-theme-projection'
import { useThemeHistory } from '@/composables/use-theme-history'
import { useThemePersistence } from '@/composables/use-theme-persistence'
import { useThemeRecovery } from '@/composables/use-theme-recovery'
import { useLocalThemePersistence } from '@/composables/use-local-theme-persistence'
import type { FreshThemeImport } from '@/models/local-theme-import.model'
import { themeStateRevision } from '@/utils/theme-state-revision'
import { readLocalThemeForRelay } from '@/utils/local-theme-read'

const storageKey = 'ftb-theme'
const recoveryStorageKey = 'ftb-theme-legacy-recovery'

export const useThemeStore = defineStore('theme', () => {
  const persistence = useThemePersistence(storageKey, recoveryStorageKey)
  const restored = persistence.restore()
  const localPersistence = useLocalThemePersistence({
    storage: localStorage,
    initialState: restored,
    now: () => Date.now(),
    schedule: (callback, delay) => window.setTimeout(callback, delay) as unknown as ReturnType<typeof setTimeout>,
    cancel: (handle) => window.clearTimeout(handle as unknown as number),
  })
  localPersistence.initialize()
  const theme = localPersistence.activeState
  const revision = computed(() => themeStateRevision({ collection: localPersistence.themes.value, activeId: localPersistence.activeThemeId.value, activeState: localPersistence.activeState.value }))
  const registry = createThemeRegistry()
  const history = useThemeHistory(theme, persistence.serialize, storageKey, localPersistence.activeHistory.value, (state, savedHistory) => {
    localPersistence.scheduleSave(localPersistence.activeThemeId.value, state, savedHistory)
  })
  const context: ThemeStoreContext = { theme, registry }
  const recovery = useThemeRecovery(theme, persistence, history.applyTheme)
  const openTheme = (id: string): void => {
    const result = localPersistence.switchTo(id)
    if (result.ok) { history.replaceHistory(localPersistence.activeHistory.value); history.applyTheme(localPersistence.activeState.value) }
  }
  const duplicateTheme = (id: string) => {
    const record = localPersistence.duplicateTheme(id)
    if (localPersistence.activeThemeId.value === record.id) { history.replaceHistory(localPersistence.activeHistory.value); history.applyTheme(localPersistence.activeState.value) }
    return record
  }
  const createTheme = () => {
    const record = localPersistence.createTheme()
    if (localPersistence.themes.value.some(({ id }) => id === record.id)) openTheme(record.id)
    return record
  }
  const saveTheme = () => localPersistence.flush(localPersistence.activeThemeId.value)
  const deleteTheme = (id: string): void => {
    const wasActive = localPersistence.activeThemeId.value === id
    const result = localPersistence.deleteTheme(id)
    if (wasActive && localPersistence.activeThemeId.value !== id) {
      history.replaceHistory(localPersistence.activeHistory.value); history.applyTheme(localPersistence.activeState.value)
    } else if (result.ok && wasActive) openTheme(localPersistence.activeThemeId.value)
  }
  const importFreshTheme = (input: FreshThemeImport) => {
    const result = localPersistence.importFreshTheme(input)
    if (result.ok) { history.replaceHistory(localPersistence.activeHistory.value); history.applyTheme(localPersistence.activeState.value) }
    return result
  }
  const getThemeState = (id: string) => {
    if (!localPersistence.themes.value.some((record) => record.id === id)) return null
    return readLocalThemeForRelay(localStorage, id, localPersistence.activeThemeId.value === id ? localPersistence.activeState.value : undefined)
  }
  return {
    theme: readonly(theme),
    themes: readonly(localPersistence.themes),
    activeThemeId: localPersistence.activeThemeId,
    activeThemeName: computed(() => localPersistence.themes.value.find(({ id }) => id === localPersistence.activeThemeId.value)?.name ?? ''),
    storageError: computed(() => localPersistence.storageError.value),
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    ...useThemeFoundationActions(context),
    ...useThemePaletteActions(context),
    ...useThemeOverrideActions(context),
    ...useThemePaddingActions(context),
    ...useThemeRawActions(context),
    ...useThemeIconBrandingActions(context),
    ...useThemeProjection(context),
    ...recovery,
    undo: history.undo,
    redo: history.redo,
    createTheme, saveTheme,
    openTheme,
    renameTheme: localPersistence.renameTheme,
    duplicateTheme,
    deleteTheme,
    importFreshTheme,
    revision,
    getThemeState,
  }
})
