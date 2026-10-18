import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import type { ResolveRequest, ThemeOverride, ThemeScope, ThemeState, ThemeStateV2 } from '@/models/theme.model'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { resolveThemeValue } from '@/utils/theme-resolver'

export function materializeSupportedOverrides(
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

export function toVersionTwo(state: ThemeState, registry: FilamentRegistry): ThemeStateV2 {
  const migrated = migrateVersionedTheme(state, registry)
  if (!migrated.ok) throw new Error(`${migrated.category}: ${migrated.message}`)
  const current = migrated.state
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
