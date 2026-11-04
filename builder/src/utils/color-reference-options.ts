import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { ColorReferenceOption } from '@/models/color-reference-option.model'
import { PALETTE_BASES } from '@/utils/foundation-defaults-data'
import { generatePalette } from '@/utils/palette-generator'
import { parseUserTokenReference } from '@/utils/user-token-validation'

const builtins = PALETTE_NAMES.flatMap((family) => {
  const shades = generatePalette(PALETTE_BASES[family])
  return PALETTE_SHADES.map((shade) => ({ value: `var(--ftb-palette-${family}-${shade})`, label: `${family} ${shade}`, color: shades[shade], group: family }))
})

export function isBuiltinPaletteReference(value: string): boolean {
  return /^var\(--(?:ftb-palette-)?(?:primary|success|warning|danger|info|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)\)$/.test(value)
}

export function legacyPaletteReferenceLabel(value: string): string | null {
  const match = /^var\(--(primary|success|warning|danger|info|gray)-(50|100|200|300|400|500|600|700|800|900|950)\)$/.exec(value)
  return match ? `${match[1]} ${match[2]} (native)` : null
}

export function colorReferenceOptions(tokens: readonly string[] = [], colors: Readonly<Record<string, string>> = {}): ColorReferenceOption[] {
  const named = [...new Set(tokens)].filter((value) => parseUserTokenReference(value) !== null).map((value) => ({
    value,
    label: value.startsWith('user.palette.') ? value.slice(13).split('.').join(' ') : value.startsWith('user.color.') ? value.slice(11) : value.slice(5),
    color: colors[value],
    group: value.startsWith('user.palette.') ? value.split('.')[2]! : 'Named colors',
  }))
  return [...builtins.map((option) => ({ ...option, color: colors[option.value] ?? option.color })), ...named]
}
