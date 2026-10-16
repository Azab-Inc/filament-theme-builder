import type { FoundationState } from '@/models/foundations.model'
import type { FoundationInventoryEntry } from '@/models/foundation-inventory-entry.model'
import type { ValidationError } from '@/models/validation-error.model'

export type FoundationMappingValidationResult =
  | { valid: true; mapping: FoundationInventoryEntry; state: FoundationState }
  | ValidationError
