import type { Density, PaletteName, PaletteShade } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { clearExplicitPath, markExplicitPath } from '@/utils/foundation-provenance'
import { isEditableFoundationPath, validateFoundationState } from '@/utils/foundation-validation'
import { cloneTheme, getPath, setPath } from '@/utils/theme-store-helpers'
import { isDerivedShadePath, rebuildPalette, syncPalette } from '@/utils/theme-store-palettes'
import type { ThemeStoreContext } from '@/models/theme-store.model'

export function useThemeFoundationActions({ theme }: ThemeStoreContext) {
  function setPrimaryColor(color: string): void {
    if (!/^#[\da-f]{6}$/i.test(color)) return
    const candidate = cloneTheme(theme.value)
    candidate.colors.primary = color.toLowerCase()
    candidate.foundations.palettes.primary.base = candidate.colors.primary
    markExplicitPath(candidate.foundations, 'palettes.primary.base')
    rebuildPalette(candidate.foundations.palettes.primary)
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
    const paletteOverride = /^palettes\.(primary|success|warning|danger|info|gray)\.overrides\.(50|100|200|300|400|500|600|700|800|900|950)$/.exec(path)
    if (!isEditableFoundationPath(path) && !paletteOverride) return
    const candidate = cloneTheme(theme.value)
    if (paletteOverride) {
      delete candidate.foundations.palettes[paletteOverride[1] as PaletteName].overrides[Number(paletteOverride[2]) as PaletteShade]
      clearExplicitPath(candidate.foundations, path)
      rebuildPalette(candidate.foundations.palettes[paletteOverride[1] as keyof typeof candidate.foundations.palettes])
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
