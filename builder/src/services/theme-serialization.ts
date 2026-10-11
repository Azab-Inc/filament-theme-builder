import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeScope, ThemeState, ThemeStateV2 } from '@/models/theme.model'
import { resolveThemeValue } from '@/services/theme-resolver'
import { validateThemeState } from '@/services/theme-validation'

export type ThemeSerializationMode = 'minimal' | 'fully-explicit'

export type ThemeSerializationResult =
  | { valid: true; mode: ThemeSerializationMode; state: ThemeStateV2 }
  | { valid: false; mode: ThemeSerializationMode; error: string }

export type ThemeDeserializeResult =
  | { valid: true; state: ThemeState }
  | { valid: false; error: string }

export function serializeTheme(
  state: ThemeState,
  registry: FilamentRegistry,
  scope: ResolveRequest,
  mode: ThemeSerializationMode,
): ThemeSerializationResult {
  const validation = validateThemeState(state, registry)
  if (!validation.valid) return { valid: false, mode, error: validation.invalidOverrides[0]?.error ?? 'Invalid theme state' }

  const currentState = toVersionTwo(state)
  if (mode === 'minimal') return { valid: true, mode, state: currentState }

  const resolved = resolveThemeValue(currentState, registry, scope)
  if (resolved.status === 'unresolved') {
    return { valid: false, mode, error: `Unresolved value for ${resolved.targetId}.${resolved.controlId}` }
  }

  const explicitState: ThemeState = {
    ...currentState,
    overrides: [createExplicitOverride(scope, resolved.value)],
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

  const validation = validateThemeState(parsed as ThemeState, registry)
  if (!validation.valid) return { valid: false, error: validation.invalidOverrides[0]?.error ?? 'Invalid theme state' }
  return { valid: true, state: validation.state }
}

function toVersionTwo(state: ThemeState): ThemeStateV2 {
  if (state.schemaVersion === 2) return structuredClone(state)
  return {
    schemaVersion: 2,
    colors: { ...state.colors },
    overrides: [{
      targetId: 'global.primary',
      controlId: 'primary',
      scope: 'global',
      value: state.colors.primary,
    }],
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
