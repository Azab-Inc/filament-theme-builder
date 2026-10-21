import type { FoundationStateV4, PaletteName, PaletteShade } from '@/models/foundations.model'
import type {
  ColorChoicePrototypeScope,
  ColorChoicePrototypeTarget,
} from '@/models/color-choice-prototype.model'
import { generatePalette } from '@/utils/palette-generator'

type ScopeValues = Record<ColorChoicePrototypeScope, string>
export function createColorChoiceTarget(
  path: string,
  label: string,
  value: string,
  resetValue: string,
  group: ColorChoicePrototypeTarget['group'],
  key: string,
  stop?: PaletteShade | 'base',
  mode?: 'light' | 'dark',
): ColorChoicePrototypeTarget {
  return { path, label, value, resetValue, group, key, stop, mode }
}
export function readColorChoiceValue(
  theme: FoundationStateV4,
  scopes: ScopeValues,
  item: ColorChoicePrototypeTarget,
): string {
  if (item.group === 'palette')
    return item.stop === 'base'
      ? theme.foundations.palettes[item.key as PaletteName].base
      : (theme.foundations.palettes[item.key as PaletteName].shades[item.stop as PaletteShade] ??
          item.resetValue)
  if (item.group === 'surface')
    return theme.foundations.surfaces[item.key as keyof typeof theme.foundations.surfaces][
      item.mode!
    ]
  if (item.group === 'border')
    return theme.foundations.borders[item.key as keyof typeof theme.foundations.borders][item.mode!]
  if (item.group === 'text')
    return theme.foundations.text[item.key as keyof typeof theme.foundations.text][item.mode!]
  return scopes[item.key as ColorChoicePrototypeScope]
}
export function writeColorChoiceValue(
  theme: FoundationStateV4,
  scopes: ScopeValues,
  item: ColorChoicePrototypeTarget,
  value: string,
): void {
  if (item.group === 'palette' && item.stop === 'base') {
    const palette = theme.foundations.palettes[item.key as PaletteName]
    palette.base = value
    if (/^#[\da-f]{6}$/i.test(value))
      palette.shades = { ...generatePalette(value), ...palette.overrides }
  } else if (item.group === 'palette') {
    theme.foundations.palettes[item.key as PaletteName].overrides[item.stop as PaletteShade] = value
    theme.foundations.palettes[item.key as PaletteName].shades[item.stop as PaletteShade] = value
  } else if (item.group === 'surface')
    theme.foundations.surfaces[item.key as keyof typeof theme.foundations.surfaces][item.mode!] =
      value
  else if (item.group === 'border')
    theme.foundations.borders[item.key as keyof typeof theme.foundations.borders][item.mode!] =
      value
  else if (item.group === 'text')
    theme.foundations.text[item.key as keyof typeof theme.foundations.text][item.mode!] = value
  else scopes[item.key as ColorChoicePrototypeScope] = value
}
export function resetColorChoiceValue(
  theme: FoundationStateV4,
  scopes: ScopeValues,
  item: ColorChoicePrototypeTarget,
): void {
  if (item.group === 'palette' && item.stop !== 'base') {
    const palette = theme.foundations.palettes[item.key as PaletteName]
    delete palette.overrides[item.stop as PaletteShade]
    const values = /^#[\da-f]{6}$/i.test(palette.base) ? generatePalette(palette.base) : null
    palette.shades[item.stop as PaletteShade] =
      values?.[item.stop as PaletteShade] ?? item.resetValue
  } else writeColorChoiceValue(theme, scopes, item, item.resetValue)
}
