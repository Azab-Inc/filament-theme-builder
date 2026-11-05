import type { PaletteName, PaletteShade } from '@/models/foundations.model'
import type { FoundationStateV4 } from '@/models/foundations.model'
import type { ComputedRef, Ref } from 'vue'

export type VisualSection = 'Foundations' | 'Components' | 'Branding' | 'Icons' | 'Inspector'
export type VisualPrototypeState = {
  theme: FoundationStateV4
  section: Ref<VisualSection>
  expandedPalette: Ref<PaletteName | null>
  activePalette: ComputedRef<PaletteName>
  paletteNames: readonly PaletteName[]
  shades: readonly PaletteShade[]
  counts: ComputedRef<Record<PaletteName, number>>
  paletteEditCount: ComputedRef<number>
  setBase: (name: PaletteName, value: string) => void
  setShade: (name: PaletteName, shade: PaletteShade, value: string) => void
  resetShade: (name: PaletteName, shade: PaletteShade) => void
  resetBase: (name: PaletteName) => void
  togglePalette: (name: PaletteName) => void
}

export type VisualPrototypeContext = {
  section: VisualSection
  activePalette: PaletteName
  expandedPalette: PaletteName | null
  setSection: (section: VisualSection) => void
  togglePalette: (name: PaletteName) => void
  setBase: (name: PaletteName, value: string) => void
  setShade: (name: PaletteName, shade: PaletteShade, value: string) => void
  resetShade: (name: PaletteName, shade: PaletteShade) => void
  resetBase: (name: PaletteName) => void
}
