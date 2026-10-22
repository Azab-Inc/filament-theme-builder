import type { RegistryEntry } from '@/models/theme-registry.model'
import { validateControl, validateUniqueKeys } from '@/registry/theme-registry-validation-controls'
import { validatePaddingTarget } from '@/registry/padding-registry-validation'

export function validateEntry(
  entry: RegistryEntry,
  ids: Set<string>,
  compatibilityPattern: RegExp,
  paddingIds: Set<string>,
): void {
  if (!entry || typeof entry !== 'object') throw new Error('Registry entry must be an object')
  if (!nonEmptyString(entry.id)) throw new Error('Registry entry ID must be non-empty')
  if (ids.has(entry.id)) throw new Error(`Duplicate registry ID: ${entry.id}`)
  if (!nonEmptyString(entry.label) || !nonEmptyString(entry.family))
    throw new Error(`Invalid metadata for ${entry.id}`)
  if (
    !Array.isArray(entry.selectors) ||
    entry.selectors.length === 0 ||
    entry.selectors.some((selector) => !isSelector(selector))
  )
    throw new Error(`Invalid selectors for ${entry.id}`)
  if (!Array.isArray(entry.controls)) throw new Error(`Controls must be an array for ${entry.id}`)
  validateUniqueKeys(entry.variants, 'variants', entry.id)
  validateUniqueKeys(entry.states, 'states', entry.id)
  if (!compatibilityPattern.test(entry.filamentCompatibility))
    throw new Error(`Invalid compatibility metadata for ${entry.id}`)
  validateUniqueKeys(
    entry.controls.map(({ id }) => id),
    'control IDs',
    entry.id,
  )
  entry.controls.forEach((control) => validateControl(control, entry.id))
  entry.paddingTargets?.forEach((target) => validatePaddingTarget(target, paddingIds))
}

function isSelector(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    /^(?:\.fi-[A-Za-z0-9_-]+)(?:(?:\s+)?\.fi-[A-Za-z0-9_-]+)*$/.test(value)
  )
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
