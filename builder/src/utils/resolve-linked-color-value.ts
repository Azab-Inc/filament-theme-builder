import type { PaletteName, PaletteShade, ThemeMode } from '@/models/foundations.model'
import type { ThemeStateCurrent, ThemeValue } from '@/models/theme.model'
import { resolveUserColorValue } from '@/utils/user-token-resolution'
import { isBuiltinPaletteReference } from '@/utils/color-reference-options'
import { resolvePaletteShade } from '@/utils/theme-store-palettes'

export function resolveLinkedColorValue(state: ThemeStateCurrent, value: ThemeValue | undefined, mode: ThemeMode): ThemeValue | undefined {
  if (typeof value !== 'string') return value
  if (value.startsWith('user.')) return resolveUserColorValue(state.foundations.userTokens, value, mode) ?? undefined
  if (isBuiltinPaletteReference(value)) {
    const family = value.slice(6, value.lastIndexOf('-')).replace(/^ftb-palette-/, '') as PaletteName
    const shade = Number(value.slice(value.lastIndexOf('-') + 1, -1)) as PaletteShade
    return resolvePaletteShade(state.foundations.palettes[family], shade, mode)
  }
  return value
}
