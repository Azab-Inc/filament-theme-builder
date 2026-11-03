import type { FoundationState, ThemeMode } from '@/models/foundations.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { resolvePaletteShade } from '@/utils/theme-store-palettes'

/** Private aliases expose builder palettes without overriding native Filament variables. */
export function themeColorVariables(state: FoundationState, mode: ThemeMode): Record<string, string> {
  return Object.fromEntries(PALETTE_NAMES.flatMap((name) => PALETTE_SHADES.map((shade) => [
    `--ftb-palette-${name}-${shade}`, resolvePaletteShade(state.palettes[name], shade, mode),
  ])))
}
