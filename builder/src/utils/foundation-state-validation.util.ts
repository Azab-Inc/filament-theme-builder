import type { FoundationValidationResult } from '@/models/foundations.model'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import { checkKeys, invalid, isRecord, isHexColor } from '@/utils/foundation-validation-shared.util'
import { validateFoundationRecord } from '@/utils/foundation-record-validation.util'
import { validateIconConfiguration } from '@/registry/icon-registry'
import { validatePanelBrandingSettings } from '@/utils/panel-branding-validation'
import { validateRawOverrides } from '@/utils/raw-override-validation'
import { overrideIdentity, validateOverride } from '@/utils/foundation-override-validation.util'
import { validatePaddingState } from '@/utils/padding-validation'
import { createThemeRegistry } from '@/registry/theme-registry'
import { validateUserTokens, hasUnknownUserReference } from '@/utils/user-token-validation'
import { validateModeLinks } from '@/utils/theme-mode-link-validation'

export function validateFoundationState(value: unknown, registry?: FilamentRegistry): FoundationValidationResult {
  if (!isRecord(value)) return invalid('invalid-value', 'state', 'Foundation state must be an object')
  return 'foundations' in value ? validateVersionedState(value, registry) : validateFoundationRecord(value, '')
}

function validateVersionedState(value: Record<string, unknown>, registry?: FilamentRegistry): FoundationValidationResult {
  const topLevel = checkKeys(value, ['schemaVersion', 'colors', 'foundations', 'overrides', 'rawOverrides', 'customCss', 'icons', 'branding', 'padding', 'modeLinks'], ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss'], '')
  if (topLevel) return topLevel
    if (value.schemaVersion !== 3 && value.schemaVersion !== 4 && value.schemaVersion !== 5 && value.schemaVersion !== 6 && value.schemaVersion !== 7) return invalid('invalid-value', 'schemaVersion', 'Unsupported foundation schema version')
    if ((value.schemaVersion === 5 || value.schemaVersion === 6 || value.schemaVersion === 7) && !('padding' in value)) return invalid('invalid-value', 'padding', 'Padding is required in schema version 5, 6, or 7')
    if (value.schemaVersion !== 5 && value.schemaVersion !== 6 && value.schemaVersion !== 7 && 'padding' in value) return invalid('invalid-value', 'padding', 'Padding is unsupported before schema version 5')
    if (value.schemaVersion === 4 || value.schemaVersion === 5 || value.schemaVersion === 6 || value.schemaVersion === 7) {
    const rawResult = validateRawOverrides(value.rawOverrides)
    if (!rawResult.valid) return invalid('invalid-value', 'rawOverrides', rawResult.error)
  }
    if (value.schemaVersion === 5 || value.schemaVersion === 6 || value.schemaVersion === 7) {
    if (!Array.isArray(value.padding)) return invalid('invalid-value', 'padding', 'Padding must be an array')
    const padding = validatePaddingState(value.padding, registry ?? createThemeRegistry())
    if (!padding.valid) return invalid('invalid-value', padding.path, padding.message)
  }
  if (!isRecord(value.colors)) return invalid('invalid-value', 'colors', 'Colors must be an object')
  const colorKeys = checkKeys(value.colors, ['primary'], ['primary'], 'colors')
  if (colorKeys) return colorKeys
  if (!isHexColor(value.colors.primary)) return invalid('invalid-value', 'colors.primary', 'Primary color must be a six- or eight-digit hex color')
  if (!Array.isArray(value.overrides)) return invalid('invalid-value', 'overrides', 'Overrides must be an array')
  const identities = new Set<string>()
  for (const [index, valueOverride] of value.overrides.entries()) {
    const path = `overrides[${index}]`
    const result = validateOverride(valueOverride, path, registry)
    if (!result.valid) return result
    const identity = overrideIdentity(result.override)
    if (identities.has(identity)) return invalid('duplicate-override', path, 'Override identity is duplicated')
    identities.add(identity)
  }
  if (value.customCss !== '') return invalid('invalid-value', 'customCss', 'Custom CSS must be empty until a safe CSS grammar is defined')
  const namedTokens = isRecord(value.foundations) ? value.foundations.userTokens : undefined
  const refs = (value.overrides as Array<{ value?: unknown; darkValue?: unknown }>).flatMap((override) => [override.value, override.darkValue])
  if (Array.isArray(value.rawOverrides)) for (const override of value.rawOverrides) refs.push(...Object.values(override.properties ?? {}), ...Object.values(override.darkProperties ?? {}))
  if (hasUnknownUserReference(namedTokens as import('@/models/user-tokens.model').UserTokens | undefined, refs)) return invalid('invalid-value', 'overrides', 'Unknown named color reference')
  if (value.icons !== undefined) {
    const result = validateIconConfiguration(value.icons)
    if (!result.valid) return invalid('invalid-value', 'icons', result.error)
  }
  if (value.branding !== undefined) {
    const result = validatePanelBrandingSettings(value.branding)
    if (!result.valid) return invalid('invalid-value', `branding.${result.path}`, result.message)
  }
  const foundationResult = validateFoundationRecord(value.foundations, 'foundations')
  if (!foundationResult.valid) return foundationResult
  const foundations = isRecord(value.foundations) ? value.foundations : null
  if (foundations?.userTokens !== undefined) {
    const errors = validateUserTokens(foundations.userTokens as never)
    if (errors.length) return invalid('invalid-value', 'foundations.userTokens', errors[0]!)
  }
  if (value.schemaVersion === 7 && foundations?.userTokens === undefined) return invalid('invalid-value', 'foundations.userTokens', 'Schema 7 requires user tokens')
  if (value.schemaVersion === 7 && value.modeLinks === undefined) return invalid('invalid-value', 'modeLinks', 'Schema 7 requires mode links')
  const linkError = value.modeLinks === undefined ? null : validateModeLinks(value.modeLinks, foundations?.userTokens as never, value as unknown as import('@/models/theme.model').ThemeStateCurrent)
  if (linkError) return invalid('invalid-value', 'modeLinks', linkError)
  return foundationResult
}
