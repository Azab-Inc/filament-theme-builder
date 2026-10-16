import type { PaletteName, PaletteState } from '@/models/foundations.model'
import { applyPaletteOverrides, generatePalette } from '@/utils/palette-generator'
import { paletteOverridePath } from '@/utils/foundation-provenance'

export function rebuildPalette(palette: PaletteState): void {
  palette.shades = applyPaletteOverrides(generatePalette(palette.base), palette.overrides)
}

export function syncPalette(theme: { colors: { primary: string }; foundations: { palettes: Record<PaletteName, PaletteState> } }, path: string): void {
  const match = /^palettes\.(primary|success|warning|danger|info|gray)\.(base|overrides)(?:\.|$)/.exec(path)
  if (!match) return
  const name = match[1] as PaletteName
  rebuildPalette(theme.foundations.palettes[name])
  if (name === 'primary') theme.colors.primary = theme.foundations.palettes.primary.base
}

export function isDerivedShadePath(path: string): boolean {
  return /^palettes\.(primary|success|warning|danger|info|gray)\.shades(?:\.|$)/.test(path)
}

export { paletteOverridePath }
