import type { Density, FoundationState } from '@/models/foundations.model'
import type { FoundationFontChoiceOption } from '@/models/foundation-font-choice-option.model'

export type FoundationsTypographyLayoutControlsProps = {
  typography: FoundationState['typography']
  spacing: FoundationState['spacing']
  density: Density
  radius: FoundationState['radius']
  borderWidth: FoundationState['borderWidth']
  shadow: FoundationState['shadow']
  fontChoices: readonly FoundationFontChoiceOption[]
  statusFor: (path: string) => string
}
