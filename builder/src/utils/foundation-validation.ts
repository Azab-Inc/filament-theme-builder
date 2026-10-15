import type { FoundationValidationResult } from '@/models/foundations.model'
import type { FoundationMappingValidationResult } from '@/models/foundation-mapping-validation-result.model'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'
import { KNOWN_EXPLICIT_PATHS } from '@/utils/foundation-validation-constants.util'
import { isColor, invalid } from '@/utils/foundation-validation-shared.util'
import { validateFoundationState } from '@/utils/foundation-state-validation.util'

export type { FoundationMappingValidationResult } from '@/models/foundation-mapping-validation-result.model'

export { validateFoundationState }

export function validateFoundationMapping(value: unknown, stateValue: unknown): FoundationMappingValidationResult {
  const stateResult = validateFoundationState(stateValue)
  if (!stateResult.valid) return stateResult
  if (typeof value !== 'string') return invalid('unsupported-mapping', 'mapping', 'Foundation mapping must be a string')
  const mapping = lookupFoundationMapping(value)
  if (!mapping) return invalid('unsupported-mapping', 'mapping', 'Foundation mapping is not in the Filament 5.9 inventory')
  return { valid: true, mapping, state: stateResult.state }
}

export function isEditableFoundationPath(path: string): boolean {
  return KNOWN_EXPLICIT_PATHS.has(path)
}

export function validateFoundationColor(value: string): { valid: true } | { valid: false; message: string } {
  return isColor(value) ? { valid: true } : { valid: false, message: 'Unsupported color reference. Use a six/eight-digit hex or an allowlisted Tailwind color.' }
}
