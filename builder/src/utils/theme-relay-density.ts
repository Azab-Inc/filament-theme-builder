import { ref, type Ref } from 'vue'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { Density } from '@/models/foundations.model'
import type { ThemeRelayIntent } from '@/models/theme-relay-intent.model'
import type { ThemeStateCurrent } from '@/models/theme.model'
import { useThemeFoundationActions } from '@/composables/use-theme-foundation-actions'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { isDensityTarget, validDensityRelayIntent } from '@/utils/theme-relay-intent-validation'

export function applyDensityRelayIntent(previous: ThemeStateCurrent, intent: ThemeRelayIntent, registry: FilamentRegistry): ThemeStateCurrent {
  if (!validDensityRelayIntent(intent.action, intent.target, intent.value)) throw new Error('invalid_intent')
  if (!isDensityTarget(intent.target) || intent.action === 'read') return cloneTheme(previous)
  const theme: Ref<ThemeStateCurrent> = ref<ThemeStateCurrent>(cloneTheme(previous))
  const foundation: ReturnType<typeof useThemeFoundationActions> = useThemeFoundationActions({ theme, registry, commit: (candidate: ThemeStateCurrent): void => { theme.value = candidate } })
  if (intent.action === 'set') {
    const value: Density = intent.value as Density
    foundation.setDensity(value)
  } else foundation.resetFoundation('density')
  return cloneTheme(theme.value)
}
