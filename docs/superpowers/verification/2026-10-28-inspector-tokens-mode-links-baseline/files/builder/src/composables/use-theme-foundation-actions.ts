import type { Density, PaletteName, PaletteShade, ThemeMode } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { clearExplicitPath, markExplicitPath } from '@/utils/foundation-provenance'
import { isEditableFoundationPath, validateFoundationState } from '@/utils/foundation-validation'
import { cloneTheme, getPath, setPath } from '@/utils/theme-store-helpers'
import { isDerivedShadePath, rebuildPalette, syncPalette } from '@/utils/theme-store-palettes'
import type { ThemeStoreContext } from '@/models/theme-store.model'

export function useThemeFoundationActions({ theme }: ThemeStoreContext) {
  function setPrimaryColor(color: string, mode: ThemeMode = 'light'): void {
    if (!/^#[\da-f]{6}$/i.test(color)) return
    const candidate = cloneTheme(theme.value)
    if (mode === 'dark') { candidate.foundations.palettes.primary.dark = { ...(candidate.foundations.palettes.primary.dark ?? {}), base: color.toLowerCase() }; markExplicitPath(candidate.foundations, 'palettes.primary.dark.base'); rebuildPalette(candidate.foundations.palettes.primary, 'dark') }
    else { candidate.colors.primary = color.toLowerCase(); candidate.foundations.palettes.primary.base = candidate.colors.primary; markExplicitPath(candidate.foundations, 'palettes.primary.base'); rebuildPalette(candidate.foundations.palettes.primary) }
    theme.value = candidate
  }

  function setFoundation(path: string, value: unknown): void {
    if (isDerivedShadePath(path) || !isEditableFoundationPath(path)) return
    const candidate = cloneTheme(theme.value)
    if (!setPath(candidate.foundations as unknown as Record<string, unknown>, path, value)) return
    markExplicitPath(candidate.foundations, path)
    syncPalette(candidate, path)
    if (validateFoundationState(candidate.foundations).valid) theme.value = candidate
  }

  function resetFoundation(path: string): void {
    if (isDerivedShadePath(path)) return
    const defaults = createDefaultFoundationState()
    const paletteOverride = /^palettes\.(primary|success|warning|danger|info|gray)\.(dark\.)?overrides\.(50|100|200|300|400|500|600|700|800|900|950)$/.exec(path)
    const paletteBase = /^palettes\.(primary|success|warning|danger|info|gray)\.dark\.base$/.exec(path)
    if (!isEditableFoundationPath(path) && !paletteOverride && !paletteBase) return
    const candidate = cloneTheme(theme.value)
    if (paletteOverride) {
      const palette = candidate.foundations.palettes[paletteOverride[1] as PaletteName]
      if (paletteOverride[2]) delete palette.dark?.overrides?.[Number(paletteOverride[3]) as PaletteShade]
      else delete palette.overrides[Number(paletteOverride[3]) as PaletteShade]
      clearExplicitPath(candidate.foundations, path)
      rebuildPalette(palette, paletteOverride[2] ? 'dark' : 'light')
    } else if (paletteBase) {
      const palette = candidate.foundations.palettes[paletteBase[1] as PaletteName]
      if (palette.dark) { delete palette.dark.base; if (!palette.dark.overrides || !Object.keys(palette.dark.overrides).length) delete palette.dark }
      clearExplicitPath(candidate.foundations, path)
      rebuildPalette(palette, 'dark')
    } else {
      const value = getPath(defaults as unknown as Record<string, unknown>, path)
      if (value === undefined || !setPath(candidate.foundations as unknown as Record<string, unknown>, path, value)) return
      if (!validateFoundationState(candidate.foundations).valid) return
      clearExplicitPath(candidate.foundations, path)
      syncPalette(candidate, path)
    }
    if (validateFoundationState(candidate.foundations).valid) theme.value = candidate
  }

  function setDensity(value: Density): void {
    if (!['compact', 'default', 'spacious'].includes(value)) return
    const candidate = cloneTheme(theme.value)
    candidate.foundations.density = value
    markExplicitPath(candidate.foundations, 'density')
    if (validateFoundationState(candidate.foundations).valid) theme.value = candidate
  }

  return { setPrimaryColor, setFoundation, resetFoundation, setDensity }
}
