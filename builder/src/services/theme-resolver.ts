import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ResolveRequest, ResolveResult, ThemeOverride, ThemeState } from '@/models/theme.model'
import { validateThemeOverride, validateThemeState } from '@/services/theme-validation'

export function resolveThemeValue(state: ThemeState, registry: FilamentRegistry, request: ResolveRequest): ResolveResult {
  const entry = registry.entries.find(({ id }) => id === request.targetId)
  const control = entry?.controls.find(({ id }) => id === request.controlId)
  if (!entry || !control) return unresolved(request)

  const validation = validateThemeState(state, registry)
  const overrides = state.schemaVersion === 2 && Array.isArray(state.overrides) ? state.overrides : []
  const validOverrides = overrides.filter((override) => validateThemeOverride(override, registry).valid)

  for (const scope of ['state', 'variant', 'component', 'global'] as const) {
    const override = validOverrides.find((candidate) => isApplicable(candidate, request, scope))
    if (override) return { status: 'resolved', value: override.value, source: scope }
  }

  if (state.schemaVersion === 1 && validation.valid && request.targetId === 'global.primary' && request.controlId === 'primary') {
    return { status: 'resolved', value: state.colors.primary, source: 'legacy-global' }
  }
  if (control.defaultValue !== undefined) return { status: 'resolved', value: control.defaultValue, source: 'registry-default' }
  return unresolved(request)
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
