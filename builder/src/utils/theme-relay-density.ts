import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { Density } from '@/models/foundations.model'
import type { ThemeRelayIntent } from '@/models/theme-relay-intent.model'
import type { ThemeStateCurrent } from '@/models/theme.model'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { isDensityTarget, validDensityRelayIntent } from '@/utils/theme-relay-intent-validation'
import { applyDensityPreset } from '@/utils/apply-density-preset'
import { clearExplicitPath, markExplicitPath } from '@/utils/foundation-provenance'

export function applyDensityRelayIntent(previous: ThemeStateCurrent, intent: ThemeRelayIntent, registry: FilamentRegistry): ThemeStateCurrent {
  if (!validDensityRelayIntent(intent.action, intent.target, intent.value)) throw new Error('invalid_intent')
  if (!isDensityTarget(intent.target) || intent.action === 'read') return cloneTheme(previous)
  const theme: ThemeStateCurrent = cloneTheme(previous)
  if (intent.action === 'set') {
    const value: Density = intent.value as Density
    theme.foundations = applyDensityPreset(theme.foundations, value)
    markExplicitPath(theme.foundations, 'density')
  } else {
    theme.foundations = applyDensityPreset(theme.foundations, 'default')
    clearExplicitPath(theme.foundations, 'density')
  }
  return cloneTheme(theme)
}
