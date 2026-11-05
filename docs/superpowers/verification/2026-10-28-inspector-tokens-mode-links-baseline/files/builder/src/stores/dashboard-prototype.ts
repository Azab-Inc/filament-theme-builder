import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ThemeMode } from '@/models/foundations.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { useThemeFoundationActions } from '@/composables/use-theme-foundation-actions'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { projectFoundations } from '@/utils/foundation-projection'

export const useDashboardPrototypeStore = defineStore('dashboard-prototype', () => {
  const theme = ref(createDefaultCurrentThemeState())
  const registry = createThemeRegistry()
  const actions = useThemeFoundationActions({ theme, registry })
  function previewFoundation(mode: ThemeMode) { return projectFoundations(theme.value.foundations, mode) }
  return { theme, previewFoundation, ...actions }
})
