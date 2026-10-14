import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import { migrateThemeState } from '@/models/theme.model'
import type { ResolveRequest, ThemeOverride, ThemeScope, ThemeState, ThemeStateV2, ThemeStateV4 } from '@/models/theme.model'
import { resolveThemeValue } from '@/services/theme-resolver'
import { validateResolveRequest, validateThemeState } from '@/services/theme-validation'
import { validateFoundationState } from '@/services/foundation-validation'

export type ThemeSerializationMode = 'minimal' | 'fully-explicit'

export type ThemeSerializationResult =
  | { valid: true; mode: ThemeSerializationMode; state: ThemeStateV2 }
  | { valid: false; mode: ThemeSerializationMode; error: string }

export type ThemeDeserializeResult =
  | { valid: true; state: ThemeStateV4 }
  | { valid: false; error: string }

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
    return { valid: true, state: migrateThemeState(structuredClone(parsed) as ThemeState) }
  }

  if (!isThemeStateShape(parsed)) return { valid: false, error: 'Invalid theme state' }

  const validation = validateThemeState(parsed, registry)
  if (!validation.valid) return { valid: false, error: validation.invalidOverrides[0]?.error ?? 'Invalid theme state' }
  return { valid: true, state: migrateThemeState(validation.state) }
}

function materializeSupportedOverrides(
  state: ThemeStateV2,
  registry: FilamentRegistry,
  scope: ResolveRequest,
): { valid: true; overrides: ThemeOverride[] } | { valid: false; error: string } {
  const entry = registry.entries.find(({ id }) => id === scope.targetId)
  if (!entry) return { valid: false, error: `Unresolved value for ${scope.targetId}.${scope.controlId}` }

  const componentId = scope.componentId ?? entry.family
  const requests = supportedRequests(entry, scope.targetId, componentId)
  const overrides: ThemeOverride[] = []

  for (const request of requests) {
    const resolved = resolveThemeValue(state, registry, request)
    if (resolved.status === 'unresolved') {
      return { valid: false, error: `Unresolved value for ${resolved.targetId}.${resolved.controlId}` }
    }
    if (resolved.status !== 'resolved') return { valid: false, error: resolved.error }
    overrides.push(createExplicitOverride(request, resolved.value))
  }

  return { valid: true, overrides }
}

function supportedRequests(entry: RegistryEntry, targetId: string, componentId: string): ResolveRequest[] {
  const requests: ResolveRequest[] = []
  for (const control of entry.controls) {
    requests.push({ targetId, controlId: control.id })
    requests.push({ targetId, controlId: control.id, componentId })
    for (const variantId of entry.variants) {
      requests.push({ targetId, controlId: control.id, componentId, variantId })
      for (const stateId of entry.states) {
        requests.push({ targetId, controlId: control.id, componentId, variantId, stateId })
      }
    }
  }
  return requests
}

function toVersionTwo(state: ThemeState): ThemeStateV2 {
  const current = migrateThemeState(state)
  return {
    schemaVersion: 2,
    colors: { primary: current.colors.primary },
    overrides: structuredClone(current.overrides),
  }
}

function createExplicitOverride(scope: ResolveRequest, value: ThemeOverride['value']): ThemeOverride {
  const resolvedScope = getDeepestScope(scope)
  const override: ThemeOverride = {
    targetId: scope.targetId,
    controlId: scope.controlId,
    scope: resolvedScope,
    value,
  }
  if (resolvedScope !== 'global') override.componentId = scope.componentId
  if (resolvedScope === 'variant' || resolvedScope === 'state') override.variantId = scope.variantId
  if (resolvedScope === 'state') override.stateId = scope.stateId
  return override
}

function getDeepestScope(scope: ResolveRequest): ThemeScope {
  if (scope.stateId !== undefined) return 'state'
  if (scope.variantId !== undefined) return 'variant'
  if (scope.componentId !== undefined) return 'component'
  return 'global'
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
