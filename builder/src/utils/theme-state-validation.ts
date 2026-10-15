import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeState } from '@/models/theme.model'
import type { ThemeOverrideValidationFailure } from '@/models/theme-override-validation-failure.model'
import type { ThemeStateValidationResult } from '@/models/theme-state-validation-result.model'
import { failure, isObject, isValidControlValue, overrideIdentity } from '@/utils/theme-validation-helpers'
import { validateThemeOverride } from '@/utils/theme-override-validation'

export function validateThemeState(state: ThemeState, registry: FilamentRegistry): ThemeStateValidationResult {
  if (!isObject(state) || (state.schemaVersion !== 1 && state.schemaVersion !== 2)) {
    return { valid: false, state, invalidOverrides: [failure({ targetId: '', controlId: '', scope: 'global' }, 'Invalid theme state')] }
  }
  const baselineControl = registry.entries.find(({ id }) => id === 'global.primary')?.controls.find(({ id }) => id === 'primary')
  const invalidBaseline = baselineControl && !isValidControlValue(state.colors?.primary, baselineControl)
    ? failure({ targetId: 'global.primary', controlId: 'primary', scope: 'global' }, 'Invalid value for global.primary.primary')
    : undefined
  if (state.schemaVersion === 1) return invalidBaseline ? { valid: false, state, invalidOverrides: [invalidBaseline] } : { valid: true, state, invalidOverrides: [] }
  if (!Array.isArray(state.overrides)) {
    return { valid: false, state, invalidOverrides: [failure({ targetId: '', controlId: '', scope: 'global' }, 'Invalid overrides collection')] }
  }
  const invalidOverrides = state.overrides.map((override) => validateThemeOverride(override, registry)).filter((result): result is ThemeOverrideValidationFailure => !result.valid)
  const duplicateIndexes = new Set<number>()
  const identities = new Map<string, number>()
  state.overrides.forEach((override, index) => {
    if (!validateThemeOverride(override, registry).valid) return
    const identity = overrideIdentity(override)
    const previous = identities.get(identity)
    if (previous !== undefined) {
      duplicateIndexes.add(index)
      if (!duplicateIndexes.has(previous)) duplicateIndexes.add(previous)
    } else identities.set(identity, index)
  })
  for (const index of duplicateIndexes) {
    const override = state.overrides[index]!
    invalidOverrides.push(failure({ targetId: override.targetId, controlId: override.controlId, scope: override.scope }, `Duplicate override identity for ${override.targetId}.${override.controlId}`))
  }
  if (invalidBaseline) invalidOverrides.unshift(invalidBaseline)
  return invalidOverrides.length === 0 ? { valid: true, state, invalidOverrides: [] } : { valid: false, state, invalidOverrides }
}
