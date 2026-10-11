import type {
  FontChoice,
  FoundationState,
  FoundationValidationResult,
  PaletteName,
  PaletteShade,
} from '@/models/foundations.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'

type ValidationError = Exclude<FoundationValidationResult, { valid: true }>
type ValidationSuccess = Extract<FoundationValidationResult, { valid: true }>

const SURFACE_KEYS = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
const BORDER_KEYS = ['default', 'strong'] as const
const TEXT_KEYS = ['primary', 'muted', 'disabled'] as const
const FONT_KEYS = ['body', 'heading', 'mono'] as const
const DENSITIES = ['compact', 'default', 'spacious'] as const
const RADII = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const SHADOWS = ['none', 'sm', 'md', 'lg', 'xl'] as const
const HEX_COLOR = /^#[\da-f]{6}(?:[\da-f]{2})?$/i
const SAFE_REFERENCE = /^var\(--(?:primary|success|warning|danger|info|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)\)$/
const SAFE_FONT_FAMILY = /^[A-Za-z0-9][A-Za-z0-9 .,_-]*$/

export function validateFoundationState(value: unknown): FoundationValidationResult {
  if (!isRecord(value)) return invalid('invalid-value', 'state', 'Foundation state must be an object')

  if ('foundations' in value) return validateVersionedState(value)

  const result = validateFoundationRecord(value, '')
  return result.valid ? { valid: true, state: value as FoundationState } : result
}

export function validateFoundationMapping(value: unknown): FoundationValidationResult | ValidationError {
  if (typeof value !== 'string' || lookupFoundationMapping(value) === undefined) {
    return invalid('unsupported-mapping', 'mapping', 'Foundation mapping is not in the Filament 5.9 inventory')
  }

  return { valid: true, state: {} as FoundationState }
}

function validateVersionedState(value: Record<string, unknown>): FoundationValidationResult {
  const topLevel = checkKeys(value, ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss'], '')
  if (topLevel) return topLevel
  if (value.schemaVersion !== 3) return invalid('invalid-value', 'schemaVersion', 'Unsupported foundation schema version')
  if (!isRecord(value.colors)) return invalid('invalid-value', 'colors', 'Colors must be an object')
  const colorKeys = checkKeys(value.colors, ['primary'], 'colors')
  if (colorKeys) return colorKeys
  const primary = validateColor(value.colors.primary)
  if (!primary) return invalid('invalid-value', 'colors.primary', 'Color must be a supported hex or palette variable')
  if (!Array.isArray(value.overrides)) return invalid('invalid-value', 'overrides', 'Overrides must be an array')

  const identities = new Set<string>()
  for (const [index, override] of value.overrides.entries()) {
    if (!isRecord(override)) return invalid('invalid-value', `overrides[${index}]`, 'Override must be an object')
    const keys = checkKeys(override, ['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'], `overrides[${index}]`)
    if (keys) return keys
    const identity = ['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId'].map((key) => String(override[key] ?? '')).join('\u0000')
    if (identities.has(identity)) return invalid('duplicate-override', `overrides[${index}]`, 'Override identity is duplicated')
    identities.add(identity)
  }

  if (typeof value.customCss !== 'string') return invalid('invalid-value', 'customCss', 'Custom CSS must be a string')
  const foundationResult = validateFoundationRecord(value.foundations, 'foundations')
  return foundationResult.valid ? { valid: true, state: value.foundations as FoundationState } : foundationResult
}

function validateFoundationRecord(value: unknown, path: string): FoundationValidationResult {
  if (!isRecord(value)) return invalid('invalid-value', path || 'state', 'Foundation state must be an object')
  const keys = checkKeys(value, ['palettes', 'surfaces', 'borders', 'text', 'typography', 'spacing', 'density', 'radius', 'borderWidth', 'shadow'], path)
  if (keys) return keys

  const result = validatePaletteCollection(value.palettes, join(path, 'palettes'))
  if (result) return result
  for (const [collection, allowed] of [[value.surfaces, SURFACE_KEYS], [value.borders, BORDER_KEYS], [value.text, TEXT_KEYS]] as const) {
    const collectionPath = collection === value.surfaces ? 'surfaces' : collection === value.borders ? 'borders' : 'text'
    const collectionResult = validateModeCollection(collection, allowed, join(path, collectionPath))
    if (collectionResult) return collectionResult
  }

  const typographyPath = join(path, 'typography')
  if (!isRecord(value.typography)) return invalid('invalid-value', typographyPath, 'Typography must be an object')
  const typographyKeys = checkKeys(value.typography, FONT_KEYS, typographyPath)
  if (typographyKeys) return typographyKeys
  for (const font of FONT_KEYS) {
    const fontResult = validateFont(value.typography[font], join(typographyPath, font))
    if (fontResult) return fontResult
  }

  if (!isRecord(value.spacing)) return invalid('invalid-value', join(path, 'spacing'), 'Spacing must be an object')
  for (const [key, number] of Object.entries(value.spacing)) {
    if (!/^\d+(?:\.5)?$|^px$/.test(key)) return invalid('unknown-key', join(path, `spacing.${key}`), 'Unknown spacing key')
    if (!isFiniteNumber(number) || number < 0) return invalid('invalid-value', join(path, `spacing.${key}`), 'Spacing must be a finite non-negative number')
  }
  if (!DENSITIES.includes(value.density as never)) return invalid('invalid-value', join(path, 'density'), 'Unsupported density')
  if (!RADII.includes(value.radius as never)) return invalid('invalid-value', join(path, 'radius'), 'Unsupported radius')
  if (!SHADOWS.includes(value.shadow as never)) return invalid('invalid-value', join(path, 'shadow'), 'Unsupported shadow')
  if (!isFiniteNumber(value.borderWidth) || value.borderWidth < 0 || value.borderWidth > 8) return invalid('invalid-value', join(path, 'borderWidth'), 'Border width must be finite and between 0 and 8')
  return { valid: true, state: value as FoundationState }
}

function validatePaletteCollection(value: unknown, path: string): ValidationError | undefined {
  if (!isRecord(value)) return invalid('invalid-value', path, 'Palettes must be an object')
  const keys = checkKeys(value, PALETTE_NAMES, path)
  if (keys) return keys
  for (const name of PALETTE_NAMES) {
    const palettePath = join(path, name)
    const palette = value[name]
    if (!isRecord(palette)) return invalid('invalid-value', palettePath, 'Palette must be an object')
    const paletteKeys = checkKeys(palette, ['base', 'shades', 'overrides'], palettePath)
    if (paletteKeys) return paletteKeys
    if (!validateColor(palette.base)) return invalid('invalid-value', join(palettePath, 'base'), 'Invalid palette base color')
    for (const collectionName of ['shades', 'overrides'] as const) {
      const collection = palette[collectionName]
      const collectionPath = join(palettePath, collectionName)
      if (!isRecord(collection)) return invalid('invalid-value', collectionPath, 'Shade values must be an object')
      for (const [shade, color] of Object.entries(collection)) {
        if (!PALETTE_SHADES.includes(Number(shade) as PaletteShade)) return invalid('unknown-key', join(collectionPath, shade), 'Unknown palette shade')
        if (!validateColor(color)) return invalid('invalid-value', join(collectionPath, shade), 'Invalid palette shade color')
      }
    }
  }
  return undefined
}

function validateModeCollection(value: unknown, allowed: readonly string[], path: string): ValidationError | undefined {
  if (!isRecord(value)) return invalid('invalid-value', path, 'Mode collection must be an object')
  const keys = checkKeys(value, allowed, path)
  if (keys) return keys
  for (const key of allowed) {
    const mode = value[key]
    if (!isRecord(mode)) return invalid('invalid-value', join(path, key), 'Mode values must be an object')
    const modeKeys = checkKeys(mode, ['light', 'dark'], join(path, key))
    if (modeKeys) return modeKeys
    for (const colorMode of ['light', 'dark'] as const) {
      if (!validateColor(mode[colorMode])) return invalid('invalid-value', join(path, `${key}.${colorMode}`), 'Invalid color value')
    }
  }
  return undefined
}

function validateFont(value: unknown, path: string): ValidationError | undefined {
  if (!isRecord(value)) return invalid('unsafe-font', path, 'Font choice must be an object')
  const commonKeys = checkKeys(value, value.kind === 'curated' ? ['kind', 'name', 'family', 'provider'] : ['kind', 'name', 'family'], path)
  if (commonKeys) return commonKeys
  if (value.kind !== 'system' && value.kind !== 'curated' && value.kind !== 'custom') return invalid('unsafe-font', join(path, 'kind'), 'Unsupported font kind')
  if (typeof value.name !== 'string' || !SAFE_FONT_FAMILY.test(value.name)) return invalid('unsafe-font', join(path, 'name'), 'Unsafe font name')
  const trustedSystemMono = value.kind === 'system' && value.family === 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
  if (typeof value.family !== 'string' || (!trustedSystemMono && (!SAFE_FONT_FAMILY.test(value.family) || /url\s*\(|@import|[\u0000-\u001f\u007f"']/.test(value.family)))) return invalid('unsafe-font', join(path, 'family'), 'Unsafe font family')
  if (value.kind === 'curated' && value.provider !== 'google-fonts') return invalid('unsafe-font', join(path, 'provider'), 'Unsupported font provider')
  return undefined
}

function validateColor(value: unknown): value is string {
  return typeof value === 'string' && (HEX_COLOR.test(value) || SAFE_REFERENCE.test(value))
}

function checkKeys(value: Record<string, unknown>, allowed: readonly string[], path: string): ValidationError | undefined {
  const allowedSet = new Set(allowed)
  const unknown = Reflect.ownKeys(value).find((key) => typeof key !== 'string' || !allowedSet.has(key))
  return unknown === undefined ? undefined : invalid('unknown-key', join(path, String(unknown)), 'Unknown foundation key')
}

function invalid(code: ValidationError['code'], path: string, message: string): ValidationError {
  return { valid: false, code, path, message }
}

function join(prefix: string, suffix: string): string {
  return prefix ? `${prefix}.${suffix}` : suffix
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
