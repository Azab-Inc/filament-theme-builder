import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import type { PaddingContext, PaddingEdge, PaddingReadRequest, PaddingReadResult, PaddingResolutionRequest, ResolvedPadding, ResolvedPaddingEdge } from '@/models/padding.model'
import { paddingEdges, validatePaddingContext, validatePaddingState } from '@/utils/padding-validation'
import { paddingRecordContext, samePaddingContext } from '@/utils/padding-identity'

const EDGES: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']

export function resolvePadding(state: ThemeStateV5, registry: FilamentRegistry, request: PaddingResolutionRequest): ResolvedPadding {
  const target = findTarget(registry, request.targetId)
  if (!target || target.status !== 'supported') throw new Error('Padding target is unsupported')
  const validRequest = validateRequest(request, target)
  const validation = validatePaddingState(state.padding, registry)
  if (!validation.valid) throw new Error(validation.message)
  const records = state.padding.filter((record) => applies(record, target.sectionId, target.targetKind, validRequest))
  return { targetId: validRequest.targetId, edges: Object.fromEntries(EDGES.map((edge) => [edge, resolveEdge(edge, records, validRequest)])) as ResolvedPadding['edges'] }
}

export function readPadding(state: ThemeStateV5, registry: FilamentRegistry, request: PaddingReadRequest): PaddingReadResult {
  validateReadRequest(request)
  const target = findTarget(registry, request.targetId)
  const selected = validatePaddingContext(request.selectedContext, registry)
  if (!target || !selected.valid || !selectedContextBelongs(request.selectedContext, request, target)) throw new Error('Selected padding context does not match target')
  const resolved = resolvePadding(state, registry, resolutionRequest(request))
  const record = state.padding.find((candidate) => samePaddingContext(paddingRecordContext(candidate), request.selectedContext))
  const edges = Object.fromEntries(EDGES.map((edge) => [edge, { ...resolved.edges[edge], explicit: resolved.edges[edge].sourceContext !== undefined && samePaddingContext(resolved.edges[edge].sourceContext, request.selectedContext) }])) as ResolvedPadding['edges']
  return { resolved: { ...resolved, edges }, selectedContext: request.selectedContext, explicitEdges: record ? paddingEdges(record.edges) : [] }
}

function resolveEdge(edge: PaddingEdge, records: ThemeStateV5['padding'], request: PaddingResolutionRequest): ResolvedPaddingEdge {
  const matching = records.filter((record) => hasEdge(record, edge)).sort((left, right) => score(right) - score(left))
  const winner = matching[0]
  if (!winner) return { edge, value: null, source: 'native', explicit: false, native: true }
  const sourceContext = paddingRecordContext(winner)
  return { edge, value: winner.edges[edge] === 0 ? '0' : winner.edges[edge]!, source: winner.scope, sourceTargetId: 'targetId' in winner ? winner.targetId : undefined, sourceContext, explicit: winner.scope === deepestScope(request), native: false }
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
function validateRequest(request: unknown, target: NonNullable<ReturnType<typeof findTarget>>): PaddingResolutionRequest {
  if (!isRecord(request) || !allowedKeys(request, ['targetId', 'variantId', 'stateId']) || typeof request.targetId !== 'string') throw new Error('Padding request is invalid')
  if (request.variantId !== undefined && (typeof request.variantId !== 'string' || !target.variants.some((variant) => variant === request.variantId))) throw new Error('Padding variant is unsupported')
  if (request.stateId !== undefined && (typeof request.stateId !== 'string' || !target.states.some((state) => state === request.stateId))) throw new Error('Padding state is unsupported')
  return { targetId: request.targetId, ...(request.variantId === undefined ? {} : { variantId: request.variantId }), ...(request.stateId === undefined ? {} : { stateId: request.stateId }) }
}
function deepestScope(request: PaddingResolutionRequest): PaddingContext['scope'] { return request.stateId !== undefined ? 'state' : request.variantId !== undefined ? 'variant' : 'component' }
function resolutionRequest(request: PaddingReadRequest): PaddingResolutionRequest { return { targetId: request.targetId, ...(request.variantId === undefined ? {} : { variantId: request.variantId }), ...(request.stateId === undefined ? {} : { stateId: request.stateId }) } }
function validateReadRequest(request: unknown): void { if (!isRecord(request) || !allowedKeys(request, ['targetId', 'variantId', 'stateId', 'selectedContext'])) throw new Error('Padding read request is invalid') }
function selectedContextBelongs(context: PaddingContext, request: PaddingReadRequest, target: NonNullable<ReturnType<typeof findTarget>>): boolean {
  if (context.scope === 'global') return target.targetKind === 'leaf'
  if (context.scope === 'section') return target.targetKind === 'leaf' && context.sectionId === target.sectionId
  if (context.targetId !== request.targetId) return false
  if (context.scope === 'component') return true
  if (context.scope === 'variant') return context.variantId === request.variantId
  return context.stateId === request.stateId && (context.variantId === undefined || context.variantId === request.variantId)
}
function allowedKeys(value: Record<string, unknown>, keys: string[]): boolean { return Object.keys(value).every((key) => keys.includes(key)) }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
