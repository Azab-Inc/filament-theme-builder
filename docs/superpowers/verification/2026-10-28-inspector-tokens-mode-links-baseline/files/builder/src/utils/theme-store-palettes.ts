import type { PaletteName, PaletteShade, PaletteState, ThemeMode } from '@/models/foundations.model'
import { applyPaletteOverrides, generatePalette } from '@/utils/palette-generator'
import { paletteOverridePath } from '@/utils/foundation-provenance'

export function rebuildPalette(palette: PaletteState, mode: 'light' | 'dark' = 'light'): void {
  if (mode === 'dark') {
    if (!palette.dark) palette.dark = {}
    if (palette.dark.base) palette.dark.shades = applyPaletteOverrides(generatePalette(palette.dark.base), palette.dark.overrides ?? {})
    else delete palette.dark.shades
    return
  }
  palette.shades = applyPaletteOverrides(generatePalette(palette.base), palette.overrides)
}

export function resolvePaletteShade(palette: PaletteState, shade: PaletteShade, mode: ThemeMode): string {
  const lightShades = applyPaletteOverrides(generatePalette(palette.base), palette.overrides)
  if (mode === 'light') return lightShades[shade] ?? palette.base
  if (!palette.dark?.base) return palette.dark?.overrides?.[shade] ?? lightShades[shade] ?? palette.base
  const darkShades = applyPaletteOverrides(generatePalette(palette.dark.base), palette.dark.overrides ?? {})
  return darkShades[shade] ?? palette.dark.base
}

export function syncPalette(theme: { colors: { primary: string }; foundations: { palettes: Record<PaletteName, PaletteState> } }, path: string): void {
  const match = /^palettes\.(primary|success|warning|danger|info|gray)\.(dark\.)?(base|overrides)(?:\.|$)/.exec(path)
  if (!match) return
  const name = match[1] as PaletteName
  rebuildPalette(theme.foundations.palettes[name], match[2] ? 'dark' : 'light')
  if (name === 'primary' && !match[2]) theme.colors.primary = theme.foundations.palettes.primary.base
}

export function isDerivedShadePath(path: string): boolean {
  return /^palettes\.(primary|success|warning|danger|info|gray)\.shades(?:\.|$)/.test(path)
}

export { paletteOverridePath }
