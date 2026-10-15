import type { RawElementOverride } from '@/models/raw-overrides.model'

export type RawValidationResult<T = RawElementOverride> =
  | { valid: true; value: T }
  | { valid: false; error: string }
