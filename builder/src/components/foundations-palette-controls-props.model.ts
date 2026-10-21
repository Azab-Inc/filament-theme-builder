import type { FoundationState, PaletteName, PaletteShade } from '@/models/foundations.model'

export type FoundationsPaletteControlsProps = {
  palettes: FoundationState['palettes']
  paletteNames: readonly PaletteName[]
  paletteShades: readonly PaletteShade[]
  statusFor: (path: string) => string
  contextKey?: string
}
