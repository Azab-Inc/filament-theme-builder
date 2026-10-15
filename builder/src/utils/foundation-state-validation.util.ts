import type { FoundationValidationResult } from '@/models/foundations.model'
import { checkKeys, invalid, isRecord, isHexColor } from '@/utils/foundation-validation-shared.util'
import { validateFoundationRecord } from '@/utils/foundation-record-validation.util'
import { validateIconConfiguration } from '@/registry/icon-registry'
import { validatePanelBrandingSettings } from '@/utils/panel-branding-validation'
import { validateRawOverrides } from '@/utils/raw-override-validation'
import { overrideIdentity, validateOverride } from '@/utils/foundation-override-validation.util'

export function validateFoundationState(value: unknown): FoundationValidationResult {
  if (!isRecord(value)) return invalid('invalid-value', 'state', 'Foundation state must be an object')
  return 'foundations' in value ? validateVersionedState(value) : validateFoundationRecord(value, '')
}

function validateVersionedState(value: Record<string, unknown>): FoundationValidationResult {
  const topLevel = checkKeys(value, ['schemaVersion', 'colors', 'foundations', 'overrides', 'rawOverrides', 'customCss', 'icons', 'branding'], ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss'], '')
  if (topLevel) return topLevel
  if (value.schemaVersion !== 3 && value.schemaVersion !== 4) return invalid('invalid-value', 'schemaVersion', 'Unsupported foundation schema version')
  if (value.schemaVersion === 4) {
    const rawResult = validateRawOverrides(value.rawOverrides)
    if (!rawResult.valid) return invalid('invalid-value', 'rawOverrides', rawResult.error)
  }
  if (!isRecord(value.colors)) return invalid('invalid-value', 'colors', 'Colors must be an object')
  const colorKeys = checkKeys(value.colors, ['primary'], ['primary'], 'colors')
  if (colorKeys) return colorKeys
  if (!isHexColor(value.colors.primary)) return invalid('invalid-value', 'colors.primary', 'Primary color must be a six- or eight-digit hex color')
  if (!Array.isArray(value.overrides)) return invalid('invalid-value', 'overrides', 'Overrides must be an array')
  const identities = new Set<string>()
  for (const [index, valueOverride] of value.overrides.entries()) {
    const path = `overrides[${index}]`
    const result = validateOverride(valueOverride, path)
    if (!result.valid) return result
    const identity = overrideIdentity(result.override)
    if (identities.has(identity)) return invalid('duplicate-override', path, 'Override identity is duplicated')
    identities.add(identity)
  }
  if (value.customCss !== '') return invalid('invalid-value', 'customCss', 'Custom CSS must be empty until a safe CSS grammar is defined')
  if (value.icons !== undefined) {
    const result = validateIconConfiguration(value.icons)
    if (!result.valid) return invalid('invalid-value', 'icons', result.error)
  }
  if (value.branding !== undefined) {
    const result = validatePanelBrandingSettings(value.branding)
    if (!result.valid) return invalid('invalid-value', `branding.${result.path}`, result.message)
  }
  return validateFoundationRecord(value.foundations, 'foundations')
}
