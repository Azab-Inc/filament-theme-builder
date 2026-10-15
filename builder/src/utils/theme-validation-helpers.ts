import type { ThemeOverride, ThemeScope } from '@/models/theme.model'
import type { ThemeOverrideValidationFailure } from '@/models/theme-override-validation-failure.model'
import type { ThemeValidationContext } from '@/models/theme-validation-context.model'
import type { FilamentRegistry, RegistryControl, RegistryEntry } from '@/models/theme-registry.model'
import type { ThemeValue } from '@/models/theme.model'
import { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry'

export function failure(context: ThemeValidationContext, error: string): ThemeOverrideValidationFailure {
  return { ...context, valid: false, error }
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function validOptionalIdentifiers(value: Record<string, unknown>): boolean {
  return ['componentId', 'variantId', 'stateId'].every((key) => value[key] === undefined || nonEmptyString(value[key]))
}

export function isValidControlValue(value: unknown, control: RegistryControl): value is ThemeValue {
  if (control.valueType === 'boolean') return typeof value === 'boolean'
  if (control.valueType === 'number') return typeof value === 'number' && Number.isFinite(value) && (control.constraints?.min === undefined || value >= control.constraints.min) && (control.constraints?.max === undefined || value <= control.constraints.max)
  if (typeof value !== 'string') return false
  return control.constraints?.pattern === undefined || new RegExp(control.constraints.pattern.source, control.constraints.pattern.flags).test(value)
}

export function isScope(value: unknown): value is ThemeScope {
  return value === 'global' || value === 'component' || value === 'variant' || value === 'state'
}

export function validateCompatibilityBaseline(registry: FilamentRegistry): string | undefined {
  if (!isObject(registry) || !Array.isArray(registry.entries) || registry.entries.length === 0) return 'Invalid compatibility baseline'
  const baseline = registry.entries[0]?.filamentCompatibility
  if (baseline !== SUPPORTED_FILAMENT_COMPATIBILITY) return 'Unsupported compatibility baseline'
  if (registry.entries.some((entry) => !isObject(entry) || entry.filamentCompatibility !== baseline || entry.filamentCompatibility !== SUPPORTED_FILAMENT_COMPATIBILITY)) return 'Mismatched compatibility baseline'
  return undefined
}

export function validateScope(override: ThemeOverride, entry: RegistryEntry): string | undefined {
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

export function overrideIdentity(override: ThemeOverride): string {
  return [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000')
}
