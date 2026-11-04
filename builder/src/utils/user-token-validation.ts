import { PALETTE_SHADES } from '@/models/foundations.model'
import type { UserTokenReference, UserTokens } from '@/models/user-tokens.model'
import { USER_TOKEN_NAME_PATTERN, USER_TOKEN_RESERVED_NAMES } from '@/models/user-tokens.model'

const referencePattern = /^user\.(palette|color)\.([a-z][a-z0-9-]{0,31})(?:\.(50|100|200|300|400|500|600|700|800|900|950))?$/

export function validateUserTokenName(name: string): string | null {
  if (!USER_TOKEN_NAME_PATTERN.test(name)) return 'Use 1–32 lowercase letters, numbers, or hyphens.'
  if (USER_TOKEN_RESERVED_NAMES.has(name)) return 'That name is reserved by a built-in palette.'
  return null
}

export function parseUserTokenReference(value: string): UserTokenReference | null {
  const match = referencePattern.exec(value)
  if (!match || (match[1] === 'palette') !== Boolean(match[3])) return null
  return value as UserTokenReference
}

export function hasUserTokenReference(tokens: UserTokens, reference: string): boolean {
  const parsed = parseUserTokenReference(reference)
  if (!parsed) return false
  const match = referencePattern.exec(parsed)
  if (!match) return false
  if (match[1] === 'color') return Object.prototype.hasOwnProperty.call(tokens.colors, match[2]!)
  return Object.prototype.hasOwnProperty.call(tokens.palettes, match[2]!) && PALETTE_SHADES.includes(Number(match[3]) as typeof PALETTE_SHADES[number])
}

export function validateUserTokens(tokens: UserTokens): string[] {
  const errors: string[] = []
  if (!record(tokens) || Object.keys(tokens).some((key) => !['palettes', 'colors'].includes(key)) || !record(tokens.palettes) || !record(tokens.colors)) return ['Token collections must be objects.']
  if (Object.keys(tokens.palettes).length + Object.keys(tokens.colors).length > 64) return ['A theme supports at most 64 named tokens.']
  for (const name of [...Object.keys(tokens.palettes), ...Object.keys(tokens.colors)]) {
    const error = validateUserTokenName(name)
    if (error) errors.push(`${name}: ${error}`)
  }
  for (const name of Object.keys(tokens.palettes)) {
    if (Object.prototype.hasOwnProperty.call(tokens.colors, name)) errors.push(`${name}: palette and color names must be unique.`)
    const palette = tokens.palettes[name]
    if (!record(palette) || Object.keys(palette).some((key) => !['base', 'shades'].includes(key)) || !validModeValue(palette.base) || !record(palette.shades) || Object.keys(palette.shades).length !== PALETTE_SHADES.length) { errors.push(`${name}: palette requires a literal base and all eleven shades.`); continue }
    for (const shade of PALETTE_SHADES) if (!palette.shades || !validModeValue(palette.shades[shade])) errors.push(`${name}.${shade}: palette shade must be a six- or eight-digit hex value.`)
  }
  for (const [name, color] of Object.entries(tokens.colors)) if (!validModeValue(color)) errors.push(`${name}: color must be a six- or eight-digit hex value.`)
  return errors
}

function validModeValue(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  return Object.keys(record).every((key) => key === 'light' || key === 'dark') && typeof record.light === 'string' && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(record.light) && (record.dark === undefined || typeof record.dark === 'string' && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(record.dark))
}

function record(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }

export function hasUnknownUserReference(tokens: UserTokens | undefined, values: unknown[]): boolean {
  return values.some((value) => typeof value === 'string' && value.startsWith('user.') && (!tokens || !hasUserTokenReference(tokens, value)))
}
