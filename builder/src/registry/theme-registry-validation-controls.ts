import type { RegistryControl, RegistryValueType } from '@/models/theme-registry.model'

const valueTypes: readonly RegistryValueType[] = ['boolean', 'color', 'number', 'string']

export function validateControl(control: RegistryControl, entryId: string): void {
  if (!control || !nonEmptyString(control.id))
    throw new Error(`Invalid control metadata for ${entryId}`)
  if (!valueTypes.includes(control.valueType))
    throw new Error(`Invalid control type for ${entryId}.${control.id}`)
  const constraints = control.constraints
  if (constraints?.pattern !== undefined && !isPattern(constraints.pattern))
    throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.min !== undefined && !Number.isFinite(constraints.min))
    throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (constraints?.max !== undefined && !Number.isFinite(constraints.max))
    throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if (
    constraints?.min !== undefined &&
    constraints?.max !== undefined &&
    constraints.min > constraints.max
  )
    throw new Error(`Invalid control constraint for ${entryId}.${control.id}`)
  if ('defaultValue' in control && !isValidControlValue(control.defaultValue, control))
    throw new Error(`Invalid default value for ${entryId}.${control.id}`)
}

export function validateUniqueKeys(keys: readonly string[], field: string, entryId: string): void {
  if (
    !Array.isArray(keys) ||
    keys.some((key) => !nonEmptyString(key)) ||
    new Set(keys).size !== keys.length
  )
    throw new Error(`Invalid ${field} metadata for ${entryId}`)
}

function isValidControlValue(value: unknown, control: RegistryControl): boolean {
  if (control.valueType === 'color' || control.valueType === 'string')
    return (
      typeof value === 'string' &&
      (!control.constraints?.pattern || testPattern(control.constraints.pattern, value))
    )
  if (control.valueType === 'number')
    return (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      (control.constraints?.min === undefined || value >= control.constraints.min) &&
      (control.constraints?.max === undefined || value <= control.constraints.max)
    )
  return typeof value === 'boolean'
}

function testPattern(pattern: RegExp | { source: string; flags: string }, value: string): boolean {
  return new RegExp(pattern.source, pattern.flags).test(value)
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isPattern(value: unknown): boolean {
  return (
    value instanceof RegExp ||
    (typeof value === 'object' &&
      value !== null &&
      typeof (value as { source?: unknown }).source === 'string' &&
      typeof (value as { flags?: unknown }).flags === 'string')
  )
}
