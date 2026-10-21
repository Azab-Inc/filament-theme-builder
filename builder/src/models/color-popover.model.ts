import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ColorFieldProfile } from '@/models/color-field.model'
import type { TailwindColor } from '@/models/tailwind-palette.model'

export type ColorPopoverProps = {
  id: string
  label: string
  open: boolean
  value: string
  profile: ColorFieldProfile
  triggerElement: HTMLElement | null
  property?: RawVisualProperty
}

export type ColorPopoverEmits = {
  close: []
  select: [color: TailwindColor]
  apply: [value: string]
}

export type CustomColorPanelProps = {
  id: string
  value: string
  profile: ColorFieldProfile
  label: string
  property?: RawVisualProperty
}

export type CustomColorPanelEmits = { apply: [value: string] }
export type TailwindColorPanelProps = { id: string; selectedValue: string }
export type TailwindColorPanelEmits = { select: [color: TailwindColor] }
