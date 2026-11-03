import type { PaletteName, PaletteShade, ThemeMode } from '@/models/foundations.model'
import { PALETTE_SHADES } from '@/models/foundations.model'
import { validateFoundationState } from '@/utils/foundation-validation'
import { clearExplicitPath, markExplicitPath } from '@/utils/foundation-provenance'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { paletteOverridePath, rebuildPalette } from '@/utils/theme-store-palettes'
import type { ThemeStoreContext } from '@/models/theme-store.model'

export function useThemePaletteActions({ theme, commit = (candidate) => { theme.value = candidate } }: ThemeStoreContext) {
  function setPaletteBase(name: PaletteName, value: string, mode: ThemeMode = 'light'): void {
    if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
    const candidate = cloneTheme(theme.value)
    if (mode === 'dark') { candidate.foundations.palettes[name].dark = { ...(candidate.foundations.palettes[name].dark ?? {}), base: value.toLowerCase() }; markExplicitPath(candidate.foundations, `palettes.${name}.dark.base`) }
    else { candidate.foundations.palettes[name].base = value.toLowerCase(); markExplicitPath(candidate.foundations, `palettes.${name}.base`); if (name === 'primary') candidate.colors.primary = value.toLowerCase() }
    rebuildPalette(candidate.foundations.palettes[name], mode)
    if (validateFoundationState(candidate.foundations).valid) commit(candidate)
  }

  function setPaletteShadeOverride(name: PaletteName, shade: PaletteShade, value: string, mode: ThemeMode = 'light'): void {
    if (!PALETTE_SHADES.includes(shade) || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
    const candidate = cloneTheme(theme.value)
    if (mode === 'dark') { const palette = candidate.foundations.palettes[name]; palette.dark = { ...(palette.dark ?? {}), overrides: { ...(palette.dark?.overrides ?? {}), [shade]: value.toLowerCase() } }; markExplicitPath(candidate.foundations, `palettes.${name}.dark.overrides.${shade}`) }
    else { candidate.foundations.palettes[name].overrides[shade] = value.toLowerCase(); markExplicitPath(candidate.foundations, paletteOverridePath(name, shade)) }
    rebuildPalette(candidate.foundations.palettes[name], mode)
    if (validateFoundationState(candidate.foundations).valid) commit(candidate)
  }

  function resetPaletteShade(name: PaletteName, shade: PaletteShade, mode: ThemeMode = 'light'): void {
    if (!PALETTE_SHADES.includes(shade)) return
    const candidate = cloneTheme(theme.value)
    const palette = candidate.foundations.palettes[name]
    if (mode === 'dark') { if (palette.dark?.overrides) delete palette.dark.overrides[shade]; clearExplicitPath(candidate.foundations, `palettes.${name}.dark.overrides.${shade}`); rebuildPalette(palette, 'dark') }
    else { delete palette.overrides[shade]; clearExplicitPath(candidate.foundations, paletteOverridePath(name, shade)); rebuildPalette(palette) }
    if (validateFoundationState(candidate.foundations).valid) commit(candidate)
  }

  return { setPaletteBase, setPaletteShadeOverride, resetPaletteShade }
}
