import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeOverride } from '@/models/theme.model'
import type { ThemeOverrideValidationResult } from '@/models/theme-override-validation-result.model'
import type { ThemeValidationContext } from '@/models/theme-validation-context.model'
import { failure, isObject, isScope, isValidControlValue, nonEmptyString, validOptionalIdentifiers, validateCompatibilityBaseline, validateScope } from '@/utils/theme-validation-helpers'

export function validateThemeOverride(override: ThemeOverride, registry: FilamentRegistry): ThemeOverrideValidationResult {
  const context: ThemeValidationContext = {
    targetId: typeof override?.targetId === 'string' ? override.targetId : '',
    controlId: typeof override?.controlId === 'string' ? override.controlId : '',
    scope: typeof override?.scope === 'string' ? override.scope : '',
  }
  if (!isObject(override)) return failure(context, 'Override must be an object')
  if (!isScope(override.scope)) return failure(context, 'Invalid scope value')
  if (!nonEmptyString(override.targetId)) return failure(context, 'Target identifier must be a non-empty string')
  if (!nonEmptyString(override.controlId)) return failure(context, 'Control identifier must be a non-empty string')
  const allowedKeys = new Set(['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'])
  if (Reflect.ownKeys(override).some((key) => typeof key !== 'string' || !allowedKeys.has(key))) return failure(context, 'Unsupported override key')
  if (!validOptionalIdentifiers(override)) return failure(context, 'Override identifiers must be non-empty strings')
  const compatibilityError = validateCompatibilityBaseline(registry)
  if (compatibilityError) return failure(context, compatibilityError)
  const entry = registry.entries.find(({ id }) => id === override.targetId)
  if (!entry) return failure(context, `Unknown target: ${override.targetId}`)
  const baseline = registry.entries[0]!.filamentCompatibility
  if (entry.filamentCompatibility !== baseline) return failure(context, `Mismatched compatibility baseline for ${override.targetId}`)
  const control = entry.controls.find(({ id }) => id === override.controlId)
  if (!control) return failure(context, `Unknown control: ${override.controlId}`)
  const scopeError = validateScope(override, entry)
  if (scopeError) return failure(context, scopeError)
  if (!isValidControlValue(override.value, control)) return failure(context, `Invalid value for ${override.targetId}.${override.controlId}`)
  return { ...context, valid: true, override }
}
