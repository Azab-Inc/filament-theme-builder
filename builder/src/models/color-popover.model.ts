import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ColorFieldProfile } from '@/models/color-field.model'
import type { TailwindColor } from '@/models/tailwind-palette.model'
import type { ColorReferenceOption } from '@/models/color-reference-option.model'

export type ColorPopoverProps = {
  id: string
  label: string
  open: boolean
  value: string
  effectiveValue?: string
  profile: ColorFieldProfile
  triggerElement: HTMLElement | null
  property?: RawVisualProperty
  nativePrimary?: boolean
  referenceOptions?: readonly ColorReferenceOption[]
}

export type ColorPopoverEmits = {
  close: []
  select: [color: TailwindColor]
  apply: [value: string]
}

export type CustomColorPanelProps = {
  id: string
  value: string
  effectiveValue?: string
  profile: ColorFieldProfile
  label: string
  property?: RawVisualProperty
  nativePrimary?: boolean
}

export type CustomColorPanelEmits = { apply: [value: string] }
export type TailwindColorPanelProps = { id: string; selectedValue: string; allowTransparent: boolean }
export type TailwindColorPanelEmits = { select: [color: TailwindColor] }
