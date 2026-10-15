import type { FoundationState, FoundationValidationResult } from '@/models/foundations.model'
import type { ValidationError } from '@/models/validation-error.model'
import { BORDER_KEYS, DENSITIES, FONT_KEYS, KNOWN_EXPLICIT_PATHS, RADII, SHADOWS, SPACING_KEYS, SURFACE_KEYS, TEXT_KEYS } from '@/utils/foundation-validation-constants.util'
import { validateFont, validateModeCollection, validatePaletteCollection } from '@/utils/foundation-collections-validation.util'
import { checkKeys, invalid, isFiniteNumber, isRecord, join } from '@/utils/foundation-validation-shared.util'

export function validateFoundationRecord(value: unknown, path: string): FoundationValidationResult {
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
  for (const [name, collection, allowed] of [['surfaces', value.surfaces, SURFACE_KEYS], ['borders', value.borders, BORDER_KEYS], ['text', value.text, TEXT_KEYS]] as const) {
    const result = validateModeCollection(collection, allowed, join(path, name))
    if (result) return result
  }
  const typographyPath = join(path, 'typography')
  if (!isRecord(value.typography)) return invalid('invalid-value', typographyPath, 'Typography must be an object')
  const typographyKeys = checkKeys(value.typography, FONT_KEYS, FONT_KEYS, typographyPath)
  if (typographyKeys) return typographyKeys
  for (const font of FONT_KEYS) {
    const result = validateFont(value.typography[font], join(typographyPath, font))
    if (result) return result
  }
  return validateRemainingFoundationValues(value, path)
}

function validateRemainingFoundationValues(value: Record<string, unknown>, path: string): FoundationValidationResult {
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

function isOneOf(values: readonly string[], value: unknown): value is string {
  return typeof value === 'string' && values.some((candidate) => candidate === value)
}
