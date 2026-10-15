import type { Density, FontChoice, FoundationState } from '@/models/foundations.model'

export type FoundationTypographyName = keyof FoundationState['typography']
export type FoundationSpacingName = keyof FoundationState['spacing']

export type FoundationFontChoiceOption = {
  value: string
  label: string
  font?: FontChoice
}

export type FoundationEventChange = {
  path: string
  event: Event
}

export type FoundationFontChange = {
  name: FoundationTypographyName
  event: Event
}

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

export type FoundationsTypographyLayoutControlsEmits = {
  'set-font-choice': [change: FoundationFontChange]
  'set-font-name': [change: FoundationFontChange]
  'set-density': [density: Density]
  'set-number-foundation': [change: FoundationEventChange]
  'set-select-foundation': [change: FoundationEventChange]
  reset: [path: string]
}
