import { computed, ref, type Ref } from 'vue'

import type { ThemeStateV5 } from '@/models/theme.model'
import { legacyRecoveryError, restoreLegacyTheme } from '@/utils/foundation-recovery'

export function useThemeRecovery(theme: Ref<ThemeStateV5>, recovery: ReturnType<typeof import('@/composables/use-theme-persistence').useThemePersistence>, applyTheme: (value: ThemeStateV5) => void) {
  const archived = ref(recovery.readRecovery())
  const errorMessage = ref(legacyRecoveryError(archived.value))

  return {
    legacyRecoveryAvailable: computed(() => archived.value !== null),
    legacyRecoveryError: computed(() => errorMessage.value),
    getLegacyRecoveryJson: (): string | null => archived.value,
    restoreLegacyRecovery: (): boolean => {
      const error = legacyRecoveryError(archived.value)
      if (error !== null) { errorMessage.value = error; return false }
      const restored = restoreLegacyTheme(archived.value)
      if (restored === null) { errorMessage.value = 'Archived theme could not be restored.'; return false }
      applyTheme(restored)
      recovery.clearRecovery()
      archived.value = null
      errorMessage.value = null
      return true
    },
  }
}
