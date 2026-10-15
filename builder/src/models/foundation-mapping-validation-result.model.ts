import type { FoundationState } from '@/models/foundations.model'
import type { FoundationInventoryEntry } from '@/registry/filament-foundation-inventory'
import type { ValidationError } from '@/models/validation-error.model'

export type FoundationMappingValidationResult =
  | { valid: true; mapping: FoundationInventoryEntry; state: FoundationState }
  | ValidationError
