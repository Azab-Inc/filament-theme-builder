import type {
  FoundationState,
  FoundationValidationResult,
  PaletteShade,
} from '@/models/foundations.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { CURATED_FONT_CHOICES } from '@/models/foundations.model'
import type { ThemeOverride, ThemeScope, ThemeValue } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { lookupFoundationMapping, type FoundationInventoryEntry } from '@/registry/filament-foundation-inventory'
import { validateThemeOverride } from '@/services/theme-validation'
import { isTrustedColor } from '@/registry/tailwind-color-catalog'
import { validateIconConfiguration } from '@/registry/icon-registry'

type ValidationError = Exclude<FoundationValidationResult, { valid: true }>

export type FoundationMappingValidationResult =
  | { valid: true; mapping: FoundationInventoryEntry; state: FoundationState }
  | ValidationError

const SURFACE_KEYS = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
const BORDER_KEYS = ['default', 'strong'] as const
const TEXT_KEYS = ['primary', 'muted', 'disabled'] as const
const FONT_KEYS = ['body', 'heading', 'mono'] as const
const DENSITIES = ['compact', 'default', 'spacious'] as const
const RADII = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const SHADOWS = ['none', 'sm', 'md', 'lg', 'xl'] as const
const SPACING_KEYS = ['0', 'px', '0.5', '1', '1.5', '2', '3', '4', '6', '8'] as const
const HEX_COLOR = /^#[\da-f]{6}(?:[\da-f]{2})?$/i
const SAFE_FONT_FAMILY = /^[A-Za-z0-9][A-Za-z0-9 .,_-]*$/
const SYSTEM_MONO_FALLBACK = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'

export function validateFoundationState(value: unknown): FoundationValidationResult {
  if (!isRecord(value)) return invalid('invalid-value', 'state', 'Foundation state must be an object')
  return 'foundations' in value ? validateVersionedState(value) : validateFoundationRecord(value, '')
}

export function validateFoundationMapping(value: unknown, stateValue: unknown): FoundationMappingValidationResult {
  const stateResult = validateFoundationState(stateValue)
  if (!stateResult.valid) return stateResult

  if (typeof value !== 'string') return invalid('unsupported-mapping', 'mapping', 'Foundation mapping must be a string')
  const mapping = lookupFoundationMapping(value)
  if (!mapping) return invalid('unsupported-mapping', 'mapping', 'Foundation mapping is not in the Filament 5.9 inventory')

  return { valid: true, mapping, state: stateResult.state }
}

export function isEditableFoundationPath(path: string): boolean {
  return KNOWN_EXPLICIT_PATHS.has(path)
}

function validateVersionedState(value: Record<string, unknown>): FoundationValidationResult {
  const topLevel = checkKeys(value, ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss', 'icons'], ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss'], '')
  if (topLevel) return topLevel
  if (value.schemaVersion !== 3) return invalid('invalid-value', 'schemaVersion', 'Unsupported foundation schema version')
  if (!isRecord(value.colors)) return invalid('invalid-value', 'colors', 'Colors must be an object')
  const colorKeys = checkKeys(value.colors, ['primary'], ['primary'], 'colors')
  if (colorKeys) return colorKeys
  if (!isHexColor(value.colors.primary)) return invalid('invalid-value', 'colors.primary', 'Primary color must be a six- or eight-digit hex color')
  if (!Array.isArray(value.overrides)) return invalid('invalid-value', 'overrides', 'Overrides must be an array')

  const identities = new Set<string>()
  for (const [index, valueOverride] of value.overrides.entries()) {
    const path = `overrides[${index}]`
    const overrideResult = validateOverride(valueOverride, path)
    if (!overrideResult.valid) return overrideResult
    const identity = overrideIdentity(overrideResult.override)
    if (identities.has(identity)) return invalid('duplicate-override', path, 'Override identity is duplicated')
    identities.add(identity)
  }

  if (value.customCss !== '') return invalid('invalid-value', 'customCss', 'Custom CSS must be empty until a safe CSS grammar is defined')
  if (value.icons !== undefined) {
    const iconResult = validateIconConfiguration(value.icons)
    if (!iconResult.valid) return invalid('invalid-value', 'icons', iconResult.error)
  }
  return validateFoundationRecord(value.foundations, 'foundations')
}

function validateOverride(value: unknown, path: string): { valid: true; override: ThemeOverride } | ValidationError {
  if (!isRecord(value)) return invalid('invalid-value', path, 'Override must be an object')
  const keys = checkKeys(value, ['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'], ['targetId', 'controlId', 'scope', 'value'], path)
  if (keys) return keys
  if (!isNonEmptyString(value.targetId)) return invalid('invalid-value', `${path}.targetId`, 'Target identifier must be a non-empty string')
  if (!isNonEmptyString(value.controlId)) return invalid('invalid-value', `${path}.controlId`, 'Control identifier must be a non-empty string')
  if (!isThemeScope(value.scope)) return invalid('invalid-value', `${path}.scope`, 'Invalid override scope')
  if (!isThemeValue(value.value)) return invalid('invalid-value', `${path}.value`, 'Override value must be a finite primitive')

  const componentId = value.componentId
  const variantId = value.variantId
  const stateId = value.stateId
  if (componentId !== undefined && !isNonEmptyString(componentId)) return invalid('invalid-value', `${path}.componentId`, 'Override identifier must be a non-empty string')
  if (variantId !== undefined && !isNonEmptyString(variantId)) return invalid('invalid-value', `${path}.variantId`, 'Override identifier must be a non-empty string')
  if (stateId !== undefined && !isNonEmptyString(stateId)) return invalid('invalid-value', `${path}.stateId`, 'Override identifier must be a non-empty string')

  const override: ThemeOverride = {
    targetId: value.targetId,
    controlId: value.controlId,
    scope: value.scope,
    value: value.value,
    ...(componentId === undefined ? {} : { componentId }),
    ...(variantId === undefined ? {} : { variantId }),
    ...(stateId === undefined ? {} : { stateId }),
  }
  const result = validateThemeOverride(override, createThemeRegistry())
  return result.valid ? { valid: true, override } : invalid('invalid-value', path, result.error)
}

function validateFoundationRecord(value: unknown, path: string): FoundationValidationResult {
  if (!isRecord(value)) return invalid('invalid-value', path || 'state', 'Foundation state must be an object')
  const foundationKeys = ['palettes', 'surfaces', 'borders', 'text', 'typography', 'spacing', 'density', 'radius', 'borderWidth', 'shadow', 'explicitPaths', 'provenanceVersion']
  const keys = checkKeys(value, foundationKeys, foundationKeys, path)
  if (keys) return keys
  if (value.provenanceVersion !== 1) return invalid('invalid-value', join(path, 'provenanceVersion'), 'Unsupported foundation provenance version')
  const provenancePath = join(path, 'explicitPaths')
  if (!Array.isArray(value.explicitPaths) || new Set(value.explicitPaths).size !== value.explicitPaths.length || value.explicitPaths.some((candidate) => typeof candidate !== 'string' || !KNOWN_EXPLICIT_PATHS.has(candidate))) {
    return invalid('invalid-value', provenancePath, 'Explicit foundation paths must be known canonical paths')
  }

  const paletteResult = validatePaletteCollection(value.palettes, join(path, 'palettes'))
  if (paletteResult) return paletteResult
  for (const explicitPath of value.explicitPaths as string[]) {
    const overridePath = /^palettes\.([^.]+)\.overrides\.(\d+)$/.exec(explicitPath)
    const palette = overridePath && isRecord(value.palettes) ? value.palettes[overridePath[1]!] : undefined
    if (overridePath && (!isRecord(palette) || !isRecord(palette.overrides) || !Object.prototype.hasOwnProperty.call(palette.overrides, overridePath[2]!))) {
      return invalid('invalid-value', provenancePath, 'Palette override provenance must reference an existing override')
    }
  }
  for (const [collectionName, collection, allowed] of [
    ['surfaces', value.surfaces, SURFACE_KEYS],
    ['borders', value.borders, BORDER_KEYS],
    ['text', value.text, TEXT_KEYS],
  ] as const) {
    const collectionResult = validateModeCollection(collection, allowed, join(path, collectionName))
    if (collectionResult) return collectionResult
  }

  const typographyPath = join(path, 'typography')
  if (!isRecord(value.typography)) return invalid('invalid-value', typographyPath, 'Typography must be an object')
  const typographyKeys = checkKeys(value.typography, FONT_KEYS, FONT_KEYS, typographyPath)
  if (typographyKeys) return typographyKeys
  for (const font of FONT_KEYS) {
    const fontResult = validateFont(value.typography[font], join(typographyPath, font))
    if (fontResult) return fontResult
  }

  const spacingPath = join(path, 'spacing')
  if (!isRecord(value.spacing)) return invalid('invalid-value', spacingPath, 'Spacing must be an object')
  const spacingKeys = checkKeys(value.spacing, SPACING_KEYS, SPACING_KEYS, spacingPath)
  if (spacingKeys) return spacingKeys
  for (const [key, spacing] of Object.entries(value.spacing)) {
    if (!isFiniteNumber(spacing) || spacing < 0 || spacing > 256) return invalid('invalid-value', join(spacingPath, key), 'Spacing must be finite and between 0 and 256')
  }
  if (!isOneOf(DENSITIES, value.density)) return invalid('invalid-value', join(path, 'density'), 'Unsupported density')
  if (!isOneOf(RADII, value.radius)) return invalid('invalid-value', join(path, 'radius'), 'Unsupported radius')
  if (!isOneOf(SHADOWS, value.shadow)) return invalid('invalid-value', join(path, 'shadow'), 'Unsupported shadow')
  if (!isFiniteNumber(value.borderWidth) || value.borderWidth < 0 || value.borderWidth > 8) return invalid('invalid-value', join(path, 'borderWidth'), 'Border width must be finite and between 0 and 8')
  return { valid: true, state: value as FoundationState }
}

const KNOWN_EXPLICIT_PATHS = new Set<string>([
  ...PALETTE_NAMES.flatMap((name) => [
    `palettes.${name}.base`,
    ...PALETTE_SHADES.map((shade) => `palettes.${name}.overrides.${shade}`),
  ]),
  ...['surfaces.page', 'surfaces.sidebar', 'surfaces.topbar', 'surfaces.card', 'surfaces.elevated', 'surfaces.input', 'borders.default', 'borders.strong', 'text.primary', 'text.muted', 'text.disabled'].flatMap((path) => [`${path}.light`, `${path}.dark`]),
  ...['body', 'heading', 'mono'].map((name) => `typography.${name}`),
  ...SPACING_KEYS.map((key) => `spacing.${key}`),
  'density', 'radius', 'borderWidth', 'shadow',
])

function validatePaletteCollection(value: unknown, path: string): ValidationError | undefined {
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

function validateModeCollection(value: unknown, allowed: readonly string[], path: string): ValidationError | undefined {
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

function validateFont(value: unknown, path: string): ValidationError | undefined {
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

function checkKeys(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[], path: string): ValidationError | undefined {
  const allowedSet = new Set(allowed)
  const unknown = Reflect.ownKeys(value).find((key) => typeof key !== 'string' || !allowedSet.has(key))
  if (unknown !== undefined) return invalid('unknown-key', join(path, String(unknown)), 'Unknown foundation key')
  const missing = required.find((key) => !Object.prototype.hasOwnProperty.call(value, key))
  return missing === undefined ? undefined : invalid('invalid-value', join(path, missing), 'Missing required foundation key')
}

function isColor(value: unknown): value is string {
  return isHexColor(value) || isTrustedColor(value)
}

export function validateFoundationColor(value: string): { valid: true } | { valid: false; message: string } {
  return isColor(value) ? { valid: true } : { valid: false, message: 'Unsupported color reference. Use a six/eight-digit hex or an allowlisted Tailwind color.' }
}

function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

function isSafeFontName(value: unknown): value is string {
  return typeof value === 'string' && SAFE_FONT_FAMILY.test(value)
}

function isThemeScope(value: unknown): value is ThemeScope {
  return value === 'global' || value === 'component' || value === 'variant' || value === 'state'
}

function isThemeValue(value: unknown): value is ThemeValue {
  return typeof value === 'string' || typeof value === 'boolean' || isFiniteNumber(value)
}

function isOneOf(values: readonly string[], value: unknown): value is string {
  return typeof value === 'string' && values.some((candidate) => candidate === value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
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

function overrideIdentity(override: ThemeOverride): string {
  return [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000')
}
