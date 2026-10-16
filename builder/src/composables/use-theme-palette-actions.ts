import type { PaletteName, PaletteShade } from '@/models/foundations.model'
import { PALETTE_SHADES } from '@/models/foundations.model'
import { validateFoundationState } from '@/utils/foundation-validation'
import { clearExplicitPath, markExplicitPath } from '@/utils/foundation-provenance'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { paletteOverridePath, rebuildPalette } from '@/utils/theme-store-palettes'
import type { ThemeStoreContext } from '@/models/theme-store.model'

export function useThemePaletteActions({ theme }: ThemeStoreContext) {
  function setPaletteBase(name: PaletteName, value: string): void {
    if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
    const candidate = cloneTheme(theme.value)
    candidate.foundations.palettes[name].base = value.toLowerCase()
    markExplicitPath(candidate.foundations, `palettes.${name}.base`)
    rebuildPalette(candidate.foundations.palettes[name])
    if (name === 'primary') candidate.colors.primary = value.toLowerCase()
    if (validateFoundationState(candidate.foundations).valid) theme.value = candidate
  }

  function setPaletteShadeOverride(name: PaletteName, shade: PaletteShade, value: string): void {
    if (!PALETTE_SHADES.includes(shade) || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
    const candidate = cloneTheme(theme.value)
    candidate.foundations.palettes[name].overrides[shade] = value.toLowerCase()
    markExplicitPath(candidate.foundations, paletteOverridePath(name, shade))
    rebuildPalette(candidate.foundations.palettes[name])
    if (validateFoundationState(candidate.foundations).valid) theme.value = candidate
  }

  function resetPaletteShade(name: PaletteName, shade: PaletteShade): void {
    if (!PALETTE_SHADES.includes(shade)) return
    const candidate = cloneTheme(theme.value)
    delete candidate.foundations.palettes[name].overrides[shade]
    clearExplicitPath(candidate.foundations, paletteOverridePath(name, shade))
    rebuildPalette(candidate.foundations.palettes[name])
    if (validateFoundationState(candidate.foundations).valid) theme.value = candidate
  }

  return { setPaletteBase, setPaletteShadeOverride, resetPaletteShade }
}
