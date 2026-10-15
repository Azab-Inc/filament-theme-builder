import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest, ResolveResult, ThemeOverride, ThemeState } from '@/models/theme.model'
import { validateResolveRequest, validateThemeOverride, validateThemeState } from '@/utils/theme-validation'

export function resolveThemeValue(state: ThemeState, registry: FilamentRegistry, request: ResolveRequest): ResolveResult {
  const requestValidation = validateResolveRequest(request, registry)
  if (!requestValidation.valid) return { status: 'invalid-request', targetId: requestValidation.targetId, controlId: requestValidation.controlId, error: requestValidation.error }
  const validRequest = requestValidation.request
  const entry = registry.entries.find(({ id }) => id === validRequest.targetId)!
  const control = entry.controls.find(({ id }) => id === validRequest.controlId)!

  const validation = validateThemeState(state, registry)
  if (!validation.valid) return { status: 'invalid-state', targetId: validRequest.targetId, controlId: validRequest.controlId, error: validation.invalidOverrides[0]?.error ?? 'Invalid theme state' }
  const overrides = state.schemaVersion === 2 && Array.isArray(state.overrides) ? state.overrides : []
  const validOverrides = overrides.filter((override) => validateThemeOverride(override, registry).valid)

  for (const scope of ['state', 'variant', 'component', 'global'] as const) {
    const override = validOverrides.find((candidate) => isApplicable(candidate, validRequest, scope))
    if (override) return { status: 'resolved', value: override.value, source: scope }
  }

  if (control.globalValue === 'primary') {
    return { status: 'resolved', value: state.colors.primary, source: 'global' }
  }
  if (control.defaultValue !== undefined) return { status: 'resolved', value: control.defaultValue, source: 'registry-default' }
  return unresolved(validRequest)
}

function isApplicable(override: ThemeOverride, request: ResolveRequest, scope: ThemeOverride['scope']): boolean {
  if (override.targetId !== request.targetId || override.controlId !== request.controlId || override.scope !== scope) return false
  if (scope === 'global') return true
  if (override.componentId !== request.componentId) return false
  if (scope === 'component') return true
  if (override.variantId !== request.variantId) return false
  if (scope === 'variant') return true
  return override.stateId === request.stateId
}

function unresolved(request: ResolveRequest): ResolveResult {
  return { status: 'unresolved', targetId: request.targetId, controlId: request.controlId }
}
