import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import type { PaddingContext, PaddingEdge, PaddingReadRequest, PaddingReadResult, PaddingResolutionRequest, ResolvedPadding, ResolvedPaddingEdge } from '@/models/padding.model'
import { paddingEdges, validatePaddingContext, validatePaddingState } from '@/utils/padding-validation'

const EDGES: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']

export function resolvePadding(state: ThemeStateV5, registry: FilamentRegistry, request: PaddingResolutionRequest): ResolvedPadding {
  const target = findTarget(registry, request.targetId)
  if (!target || target.status !== 'supported') throw new Error('Padding target is unsupported')
  validateRequest(target, request)
  const validation = validatePaddingState(state.padding, registry)
  if (!validation.valid) throw new Error(validation.message)
  const records = state.padding.filter((record) => applies(record, target.sectionId, target.targetKind, request))
  return { targetId: request.targetId, edges: Object.fromEntries(EDGES.map((edge) => [edge, resolveEdge(edge, records, request.targetId)])) as ResolvedPadding['edges'] }
}

export function readPadding(state: ThemeStateV5, registry: FilamentRegistry, request: PaddingReadRequest): PaddingReadResult {
  const resolved = resolvePadding(state, registry, request)
  const selected = validatePaddingContext(request.selectedContext, registry)
  if (!selected.valid || !contextMatchesRequest(request.selectedContext, request)) throw new Error('Selected padding context does not match request')
  const record = state.padding.find((candidate) => contextMatches(candidate, request.selectedContext))
  return { resolved, selectedContext: request.selectedContext, explicitEdges: record ? paddingEdges(record.edges) : [] }
}

function resolveEdge(edge: PaddingEdge, records: ThemeStateV5['padding'], targetId: string): ResolvedPaddingEdge {
  const matching = records.filter((record) => hasEdge(record, edge)).sort((left, right) => score(right) - score(left))
  const winner = matching[0]
  if (!winner) return { edge, value: null, source: 'native', explicit: false, native: true }
  return { edge, value: winner.edges[edge] === 0 ? '0' : winner.edges[edge]!, source: winner.scope, sourceTargetId: 'targetId' in winner ? winner.targetId : undefined, explicit: true, native: false }
}

function score(record: ThemeStateV5['padding'][number]): number {
  if (record.scope === 'state') return 500 + ('variantId' in record && record.variantId ? 1 : 0)
  if (record.scope === 'variant') return 400
  if (record.scope === 'component') return 300
  if (record.scope === 'section') return 200
  return 100
}
function hasEdge(record: ThemeStateV5['padding'][number], edge: PaddingEdge): boolean { return Object.prototype.hasOwnProperty.call(record.edges, edge) }
function applies(record: ThemeStateV5['padding'][number], sectionId: string, kind: 'leaf' | 'container', request: PaddingResolutionRequest): boolean {
  if (record.scope === 'global') return kind !== 'container'
  if (record.scope === 'section') return sectionId === record.sectionId && kind !== 'container'
  if ('targetId' in record && record.targetId !== request.targetId) return false
  if (record.scope === 'component') return true
  if (record.scope === 'variant') return record.variantId === request.variantId
  return record.stateId === request.stateId && (record.variantId === undefined || record.variantId === request.variantId)
}

function findTarget(registry: FilamentRegistry, targetId: string) { return registry.entries.flatMap((entry) => entry.paddingTargets ?? []).find((candidate) => candidate.id === targetId) }
function validateRequest(target: NonNullable<ReturnType<typeof findTarget>>, request: PaddingResolutionRequest): void {
  if (request.variantId !== undefined && !target.variants.includes(request.variantId)) throw new Error('Padding variant is unsupported')
  if (request.stateId !== undefined && !target.states.includes(request.stateId)) throw new Error('Padding state is unsupported')
}
function contextMatchesRequest(context: PaddingContext, request: PaddingResolutionRequest): boolean {
  if (context.scope === 'global' || context.scope === 'section') return true
  if (context.targetId !== request.targetId) return false
  if (context.scope === 'component') return true
  if (context.scope === 'variant') return context.variantId === request.variantId
  return context.stateId === request.stateId && (context.variantId === undefined || context.variantId === request.variantId)
}
function contextMatches(left: ThemeStateV5['padding'][number], right: PaddingContext): boolean {
  const { edges: _edges, ...context } = left
  return JSON.stringify(context) === JSON.stringify(right)
}
