import type { FilamentRegistry, RegistryControl, RegistryEntry } from '@/models/theme-registry.model'
import { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry'
import type { ThemeOverride, ThemeScope, ThemeState, ThemeValue } from '@/models/theme.model'

export type ThemeValidationContext = {
  targetId: string
  controlId: string
  scope: string
}

export type ThemeOverrideValidationFailure = ThemeValidationContext & {
  valid: false
  error: string
}

export type ThemeOverrideValidationResult =
  | (ThemeValidationContext & { valid: true; override: ThemeOverride })
  | ThemeOverrideValidationFailure

export type ThemeStateValidationResult =
  | { valid: true; state: ThemeState; invalidOverrides: [] }
  | { valid: false; state: ThemeState; invalidOverrides: ThemeOverrideValidationFailure[] }

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
  if (hasUnsupportedKeys(override)) return failure(context, 'Unsupported override key')
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
  if (invalidBaseline) invalidOverrides.unshift(invalidBaseline)
  return invalidOverrides.length === 0 ? { valid: true, state, invalidOverrides: [] } : { valid: false, state, invalidOverrides }
}

function validateScope(override: ThemeOverride, entry: RegistryEntry): string | undefined {
  const hasComponent = override.componentId !== undefined
  const hasVariant = override.variantId !== undefined
  const hasState = override.stateId !== undefined

  if (override.scope === 'global' && (hasComponent || hasVariant || hasState)) return 'Global scope cannot declare component, variant, or state keys'
  if (override.scope === 'component' && (!hasComponent || hasVariant || hasState)) return 'Component scope requires only componentId'
  if (override.scope === 'variant' && (!hasComponent || !hasVariant || hasState)) return 'Variant scope requires componentId and variantId'
  if (override.scope === 'state' && (!hasComponent || !hasVariant || !hasState)) return 'State scope requires componentId, variantId, and stateId'
  if (hasComponent && override.componentId !== entry.family) return `Unknown component: ${override.componentId}`
  if (hasVariant && !entry.variants.includes(override.variantId!)) return `Unsupported variant: ${override.variantId}`
  if (hasState && !entry.states.includes(override.stateId!)) return `Unsupported state: ${override.stateId}`
  return undefined
}

function validateCompatibilityBaseline(registry: FilamentRegistry): string | undefined {
  if (!isObject(registry) || !Array.isArray(registry.entries) || registry.entries.length === 0) return 'Invalid compatibility baseline'
  const baseline = registry.entries[0]?.filamentCompatibility
  if (!isCompatibilityBaseline(baseline)) return 'Unsupported compatibility baseline'
  if (registry.entries.some((entry) => !isObject(entry) || entry.filamentCompatibility !== baseline || !isCompatibilityBaseline(entry.filamentCompatibility))) return 'Mismatched compatibility baseline'
  return undefined
}

function hasUnsupportedKeys(override: Record<string, unknown>): boolean {
  const allowedKeys = new Set(['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'])
  return Reflect.ownKeys(override).some((key) => typeof key !== 'string' || !allowedKeys.has(key))
}

function validOptionalIdentifiers(override: Record<string, unknown>): boolean {
  return ['componentId', 'variantId', 'stateId'].every((key) => override[key] === undefined || nonEmptyString(override[key]))
}

function isCompatibilityBaseline(value: unknown): value is string {
  return value === SUPPORTED_FILAMENT_COMPATIBILITY
}

function isValidControlValue(value: unknown, control: RegistryControl): value is ThemeValue {
  if (control.valueType === 'boolean') return typeof value === 'boolean'
  if (control.valueType === 'number') return typeof value === 'number' && Number.isFinite(value) && (control.constraints?.min === undefined || value >= control.constraints.min) && (control.constraints?.max === undefined || value <= control.constraints.max)
  if (typeof value !== 'string') return false
  return control.constraints?.pattern === undefined || new RegExp(control.constraints.pattern.source, control.constraints.pattern.flags).test(value)
}

function failure(context: ThemeValidationContext, error: string): ThemeOverrideValidationFailure {
  return { ...context, valid: false, error }
}

function isScope(value: unknown): value is ThemeScope {
  return value === 'global' || value === 'component' || value === 'variant' || value === 'state'
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
