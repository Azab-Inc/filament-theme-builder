import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeDeserializeResult } from '@/models/theme-deserialize-result.model'
import type { ThemeSerializationMode } from '@/models/theme-serialization-mode.model'
import type { ThemeSerializationResult } from '@/models/theme-serialization-result.model'
import type { ResolveRequest, ThemeState, ThemeStateV2, ThemeStateV4 } from '@/models/theme.model'
import { materializeSupportedOverrides, toVersionTwo } from '@/utils/theme-serialization-helpers'
import { validateResolveRequest, validateThemeState } from '@/utils/theme-validation'
import { validateFoundationState } from '@/utils/foundation-validation'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'

export type { ThemeDeserializeResult } from '@/models/theme-deserialize-result.model'
export type { ThemeSerializationMode } from '@/models/theme-serialization-mode.model'
export type { ThemeSerializationResult } from '@/models/theme-serialization-result.model'

/**
 * Return the public, lossless representation used by JSON export.
 *
 * Unlike local persistence, public export retains generated palette shades so
 * the exported document exactly describes the rendered foundation state.
 */
export function serializeCanonicalTheme(state: unknown): ThemeStateV4 {
  return structuredClone(JSON.parse(JSON.stringify(state)) as ThemeStateV4)
}

export function serializeTheme(
  state: ThemeState,
  registry: FilamentRegistry,
  scope: ResolveRequest,
  mode: ThemeSerializationMode,
): ThemeSerializationResult {
  const validation = validateThemeState(state, registry)
  if (!validation.valid) return { valid: false, mode, error: validation.invalidOverrides[0]?.error ?? 'Invalid theme state' }
  const requestValidation = validateResolveRequest(scope, registry)
  if (!requestValidation.valid) return { valid: false, mode, error: requestValidation.error }

  const currentState = toVersionTwo(state)
  if (mode === 'minimal') return { valid: true, mode, state: currentState }

  const explicitOverrides = materializeSupportedOverrides(currentState, registry, scope)
  if (!explicitOverrides.valid) return { valid: false, mode, error: explicitOverrides.error }

  const explicitState: ThemeStateV2 = {
    ...currentState,
    overrides: explicitOverrides.overrides,
  }
  const explicitValidation = validateThemeState(explicitState, registry)
  if (!explicitValidation.valid) return { valid: false, mode, error: explicitValidation.invalidOverrides[0]?.error ?? 'Invalid fully-explicit theme state' }
  return { valid: true, mode, state: explicitState }
}

export function deserializeTheme(input: unknown, registry: FilamentRegistry): ThemeDeserializeResult {
  let parsed: unknown = input
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input)
    } catch {
      return { valid: false, error: 'Invalid theme JSON' }
    }
  }

  if (isCanonicalThemeStateShape(parsed)) {
    const validation = validateFoundationState(parsed)
    if (!validation.valid) return { valid: false, error: validation.message }
    const migrated = migrateVersionedTheme(structuredClone(parsed) as ThemeState, registry)
    return migrated.ok ? { valid: true, state: migrated.state } : { valid: false, error: migrated.message }
  }

  if (!isThemeStateShape(parsed)) return { valid: false, error: 'Invalid theme state' }

  const validation = validateThemeState(parsed, registry)
  if (!validation.valid) return { valid: false, error: validation.invalidOverrides[0]?.error ?? 'Invalid theme state' }
  const migrated = migrateVersionedTheme(validation.state, registry)
  return migrated.ok ? { valid: true, state: migrated.state } : { valid: false, error: migrated.message }
}

function isThemeStateShape(value: unknown): value is ThemeState {
  if (!isRecord(value) || (value.schemaVersion !== 1 && value.schemaVersion !== 2)) return false
  if (!isRecord(value.colors) || typeof value.colors.primary !== 'string') return false
  return value.schemaVersion === 1 || Array.isArray(value.overrides)
}

function isCanonicalThemeStateShape(value: unknown): value is ThemeState {
  return isRecord(value) && (value.schemaVersion === 3 || value.schemaVersion === 4) && isRecord(value.colors) && typeof value.colors.primary === 'string' && isRecord(value.foundations)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
