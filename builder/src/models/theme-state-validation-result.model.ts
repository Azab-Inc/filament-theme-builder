import type { ThemeOverrideValidationFailure } from '@/models/theme-override-validation-failure.model'
import type { ThemeState } from '@/models/theme.model'

export type ThemeStateValidationResult =
  | { valid: true; state: ThemeState; invalidOverrides: [] }
  | { valid: false; state: ThemeState; invalidOverrides: ThemeOverrideValidationFailure[] }
