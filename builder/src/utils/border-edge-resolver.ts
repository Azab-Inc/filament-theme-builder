import type { BorderEdge, BorderProperty, BorderResolveRequest, ResolvedBorderEdge } from '@/models/border-edge.model'
import { validateBorderEdges } from '@/utils/border-edge-validation'
import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateCurrent } from '@/models/theme.model'

export function resolveBorderEdge(state: ThemeStateCurrent, registry: FilamentRegistry, request: BorderResolveRequest, edge: BorderEdge, property: BorderProperty): ResolvedBorderEdge {
  const validation = validateBorderEdges(state.borderEdges, registry)
  if (!validation.valid) throw new Error(validation.message)
  const mode = request.mode ?? 'light'
  const candidate = state.borderEdges.filter((item) => item.targetId === request.targetId && item.edge === edge && item.property === property && matches(item, request) && modeApplies(item, request.mode ?? 'light')).sort((left, right) => score(right, request) - score(left, request))[0]
  if (!candidate) return { edge, property, value: null, source: 'native', explicit: false }
  const value = mode === 'dark' ? (candidate.darkValue ?? candidate.value) : candidate.value
  return { edge, property, value: value ?? null, source: candidate.scope, explicit: mode === 'dark' ? candidate.darkValue !== undefined : candidate.value !== undefined }
}
function score(value: ThemeStateCurrent['borderEdges'][number], request: BorderResolveRequest): number {
  if (value.scope === 'state' && value.stateId === request.stateId && value.variantId === request.variantId) return 400
  if (value.scope === 'variant' && value.variantId === request.variantId) return 300
  if (value.scope === 'component' && value.componentId === request.componentId) return 200
  if (value.scope === 'global') return 100
  return -1
}

function matches(value: ThemeStateCurrent['borderEdges'][number], request: BorderResolveRequest): boolean {
  if (value.scope === 'global') return true
  if (value.scope === 'component') return value.componentId === request.componentId
  if (value.scope === 'variant') return value.variantId === request.variantId && (!value.componentId || value.componentId === request.componentId)
  return value.stateId === request.stateId && value.variantId === request.variantId && (!value.componentId || value.componentId === request.componentId)
}

function modeApplies(value: ThemeStateCurrent['borderEdges'][number], mode: 'light' | 'dark'): boolean {
  return mode === 'light' ? value.value !== undefined : value.value !== undefined || value.darkValue !== undefined
}
