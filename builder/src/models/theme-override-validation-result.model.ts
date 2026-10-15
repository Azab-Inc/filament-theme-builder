import type { ThemeOverrideValidationFailure } from '@/models/theme-override-validation-failure.model'
import type { ThemeValidationContext } from '@/models/theme-validation-context.model'
import type { ThemeOverride } from '@/models/theme.model'

export type ThemeOverrideValidationResult =
  | (ThemeValidationContext & { valid: true; override: ThemeOverride })
  | ThemeOverrideValidationFailure
