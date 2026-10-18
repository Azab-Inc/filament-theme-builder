import type { ThemeOverride, ThemeScope, ThemeValue } from '@/models/theme.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import { validateThemeOverride } from '@/utils/theme-validation'
import { createThemeRegistry } from '@/registry/theme-registry'
import { checkKeys, invalid, isFiniteNumber, isRecord } from '@/utils/foundation-validation-shared.util'
import type { ValidationError } from '@/models/validation-error.model'

export function validateOverride(value: unknown, path: string, registry: FilamentRegistry = createThemeRegistry()): { valid: true; override: ThemeOverride } | ValidationError {
  if (!isRecord(value)) return invalid('invalid-value', path, 'Override must be an object')
  const keys = checkKeys(value, ['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'], ['targetId', 'controlId', 'scope', 'value'], path)
  if (keys) return keys
  if (!isNonEmptyString(value.targetId)) return invalid('invalid-value', `${path}.targetId`, 'Target identifier must be a non-empty string')
  if (!isNonEmptyString(value.controlId)) return invalid('invalid-value', `${path}.controlId`, 'Control identifier must be a non-empty string')
  if (!isThemeScope(value.scope)) return invalid('invalid-value', `${path}.scope`, 'Invalid override scope')
  if (!isThemeValue(value.value)) return invalid('invalid-value', `${path}.value`, 'Override value must be a finite primitive')
  const componentId = value.componentId
  const variantId = value.variantId
  const stateId = value.stateId
  if (componentId !== undefined && !isNonEmptyString(componentId)) return invalid('invalid-value', `${path}.componentId`, 'Override identifier must be a non-empty string')
  if (variantId !== undefined && !isNonEmptyString(variantId)) return invalid('invalid-value', `${path}.variantId`, 'Override identifier must be a non-empty string')
  if (stateId !== undefined && !isNonEmptyString(stateId)) return invalid('invalid-value', `${path}.stateId`, 'Override identifier must be a non-empty string')
  const override: ThemeOverride = { targetId: value.targetId, controlId: value.controlId, scope: value.scope, value: value.value,
    ...(componentId === undefined ? {} : { componentId }), ...(variantId === undefined ? {} : { variantId }), ...(stateId === undefined ? {} : { stateId }),
  }
  const result = validateThemeOverride(override, registry)
  return result.valid ? { valid: true, override } : invalid('invalid-value', path, result.error)
}

export function overrideIdentity(override: ThemeOverride): string {
  return [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000')
}

function isThemeScope(value: unknown): value is ThemeScope {
  return value === 'global' || value === 'component' || value === 'variant' || value === 'state'
}

function isThemeValue(value: unknown): value is ThemeValue {
  return typeof value === 'string' || typeof value === 'boolean' || isFiniteNumber(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
