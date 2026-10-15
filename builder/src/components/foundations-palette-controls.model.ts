import type { FoundationState, PaletteName, PaletteShade } from '@/models/foundations.model'

export type PaletteBaseChange = {
  name: PaletteName
  value: string
}

export type PaletteShadeChange = {
  name: PaletteName
  shade: PaletteShade
  value: string
}

export type PaletteShadeReset = {
  name: PaletteName
  shade: PaletteShade
}

export type FoundationsPaletteControlsProps = {
  palettes: FoundationState['palettes']
  paletteNames: readonly PaletteName[]
  paletteShades: readonly PaletteShade[]
  statusFor: (path: string) => string
}

export type FoundationsPaletteControlsEmits = {
  'set-palette-base': [change: PaletteBaseChange]
  'set-palette-shade': [change: PaletteShadeChange]
  'reset-palette-base': [name: PaletteName]
  'reset-palette-shade': [reset: PaletteShadeReset]
}
