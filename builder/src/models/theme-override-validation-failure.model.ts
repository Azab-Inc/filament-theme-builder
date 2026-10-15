import type { ThemeValidationContext } from '@/models/theme-validation-context.model'

export type ThemeOverrideValidationFailure = ThemeValidationContext & {
  valid: false
  error: string
}
