import { CURATED_FONT_CHOICES, SAFE_FONT_FAMILY, SYSTEM_MONO_FALLBACK } from '@/utils/foundation-validation-constants.util'
import { PALETTE_NAMES, PALETTE_SHADES, type PaletteShade } from '@/models/foundations.model'
import type { ValidationError } from '@/models/validation-error.model'
import { checkKeys, invalid, isColor, isRecord, isSafeFontName, join } from '@/utils/foundation-validation-shared.util'

export function validatePaletteCollection(value: unknown, path: string): ValidationError | undefined {
  if (!isRecord(value)) return invalid('invalid-value', path, 'Palettes must be an object')
  const keys = checkKeys(value, PALETTE_NAMES, PALETTE_NAMES, path)
  if (keys) return keys
  for (const name of PALETTE_NAMES) {
    const palettePath = join(path, name)
    const palette = value[name]
    if (!isRecord(palette)) return invalid('invalid-value', palettePath, 'Palette must be an object')
    const paletteKeys = checkKeys(palette, ['base', 'shades', 'overrides'], ['base', 'shades', 'overrides'], palettePath)
    if (paletteKeys) return paletteKeys
    if (!isColor(palette.base)) return invalid('invalid-value', join(palettePath, 'base'), 'Invalid palette base color')
    for (const collectionName of ['shades', 'overrides'] as const) {
      const collection = palette[collectionName]
      const collectionPath = join(palettePath, collectionName)
      if (!isRecord(collection)) return invalid('invalid-value', collectionPath, 'Shade values must be an object')
      for (const [shade, color] of Object.entries(collection)) {
        if (!PALETTE_SHADES.includes(Number(shade) as PaletteShade)) return invalid('unknown-key', join(collectionPath, shade), 'Unknown palette shade')
        if (!isColor(color)) return invalid('invalid-value', join(collectionPath, shade), 'Invalid palette shade color')
      }
    }
  }
  return undefined
}

export function validateModeCollection(value: unknown, allowed: readonly string[], path: string): ValidationError | undefined {
  if (!isRecord(value)) return invalid('invalid-value', path, 'Mode collection must be an object')
  const keys = checkKeys(value, allowed, allowed, path)
  if (keys) return keys
  for (const key of allowed) {
    const mode = value[key]
    if (!isRecord(mode)) return invalid('invalid-value', join(path, key), 'Mode values must be an object')
    const modeKeys = checkKeys(mode, ['light', 'dark'], ['light', 'dark'], join(path, key))
    if (modeKeys) return modeKeys
    for (const colorMode of ['light', 'dark'] as const) {
      if (!isColor(mode[colorMode])) return invalid('invalid-value', join(path, `${key}.${colorMode}`), 'Invalid color value')
    }
  }
  return undefined
}

export function validateFont(value: unknown, path: string): ValidationError | undefined {
  if (!isRecord(value)) return invalid('unsafe-font', path, 'Font choice must be an object')
  const allowed = value.kind === 'curated' ? ['kind', 'name', 'family', 'provider'] : ['kind', 'name', 'family']
  const keys = checkKeys(value, allowed, ['kind', 'name', 'family'], path)
  if (keys) return keys
  if (value.kind !== 'system' && value.kind !== 'curated' && value.kind !== 'custom') return invalid('unsafe-font', join(path, 'kind'), 'Unsupported font kind')
  if (!isSafeFontName(value.name)) return invalid('unsafe-font', join(path, 'name'), 'Unsafe font name')
  const trustedSystemMono = value.kind === 'system' && value.family === SYSTEM_MONO_FALLBACK
  if (typeof value.family !== 'string' || (!trustedSystemMono && (!SAFE_FONT_FAMILY.test(value.family) || /url\s*\(|@import|[\u0000-\u001f\u007f"']/.test(value.family)))) return invalid('unsafe-font', join(path, 'family'), 'Unsafe font family')
  if (value.kind === 'curated') {
    const curated = CURATED_FONT_CHOICES.find((choice) => choice.name === value.name && choice.family === value.family)
    if (value.provider !== 'google-fonts' || !curated) return invalid('unsafe-font', path, 'Curated font is not allowlisted')
  }
  if (value.kind === 'custom' && value.name !== value.family) return invalid('unsafe-font', path, 'Custom fonts must use a safe name-only family')
  return undefined
}
