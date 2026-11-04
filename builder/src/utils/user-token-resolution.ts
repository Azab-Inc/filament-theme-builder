import type { PaletteShade, ThemeMode } from '@/models/foundations.model'
import type { ColorValue, UserTokens } from '@/models/user-tokens.model'
import { hasUserTokenReference, parseUserTokenReference } from '@/utils/user-token-validation'

export function resolveUserColorValue(tokens: UserTokens | undefined, value: ColorValue, mode: ThemeMode): string | null {
  if (!tokens || typeof value !== 'string') return null
  const reference = parseUserTokenReference(value)
  if (!reference) return value
  if (!hasUserTokenReference(tokens, reference)) return null
  const parts = reference.split('.')
  const name = parts[2]!
  if (parts[1] === 'color') return tokens.colors[name]?.[mode] ?? tokens.colors[name]?.light ?? null
  const shade = Number(parts[3]) as PaletteShade
  const palette = tokens.palettes[name]
  return palette?.shades[shade]?.[mode] ?? palette?.shades[shade]?.light ?? null
}
