import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { PaddingContext, PaddingEdges, PaddingMutation, PaddingRecord, PaddingValidationResult } from '@/models/padding.model'
import type { PaddingEdge } from '@/models/padding-registry.model'
import { PADDING_UNITS } from '@/models/padding-registry.model'

const EDGES: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']
const unsafeKey = (key: string) => key === '__proto__' || key === 'constructor' || key === 'prototype'

export function validatePaddingState(value: unknown, registry: FilamentRegistry): PaddingValidationResult {
  if (!Array.isArray(value)) return failure('padding', 'Padding must be an array')
  const identities = new Set<string>()
  for (const [index, record] of value.entries()) {
    const result = validatePaddingRecord(record, registry, `padding[${index}]`)
    if (!result.valid) return result
    const identity = JSON.stringify(contextOf(result.record!))
    if (identities.has(identity)) return failure(`padding[${index}]`, 'Padding context is duplicated', 'duplicate-identity')
    identities.add(identity)
  }
  return { valid: true }
}

export function validatePaddingRecord(value: unknown, registry: FilamentRegistry, path = 'padding'): PaddingValidationResult & { record?: PaddingRecord } {
  if (!isRecord(value) || !isRecord(value.edges)) return failure(path, 'Padding record must contain an edges object')
  const contextResult = validateContext(value, registry, path)
  if (!contextResult.valid) return contextResult
  const keys = Object.keys(value)
  if (keys.some(unsafeKey) || keys.some((key) => key !== 'scope' && key !== 'sectionId' && key !== 'targetId' && key !== 'variantId' && key !== 'stateId' && key !== 'edges')) return failure(path, 'Padding record has unknown keys', 'unknown-key')
  const edgeKeys = Object.keys(value.edges)
  if (edgeKeys.some(unsafeKey) || edgeKeys.some((edge) => !EDGES.includes(edge as PaddingEdge))) return failure(`${path}.edges`, 'Padding edge is unknown', 'unknown-key')
  for (const edge of edgeKeys) {
    const result = validatePaddingValue(value.edges[edge], registryTarget(value, registry)?.units ?? PADDING_UNITS, `${path}.edges.${edge}`)
    if (!result.valid) return result
  }
  if (!edgeKeys.length) return failure(`${path}.edges`, 'Padding edges cannot be empty')
  return { valid: true, record: value as PaddingRecord }
}

export function validatePaddingContext(context: PaddingContext, registry: FilamentRegistry, path = 'context'): PaddingValidationResult {
  return validateContext({ ...context, edges: { top: 0 } }, registry, path)
}

export function validatePaddingMutation(input: PaddingMutation, state: { padding: PaddingRecord[] }, registry: FilamentRegistry): PaddingValidationResult {
  const context = validatePaddingContext(input.context, registry)
  if (!context.valid) return context
  if (input.operation === 'set') {
    if (!input.edges || !Object.keys(input.edges).length) return failure('edges', 'Padding set requires at least one edge')
    return validatePaddingRecord({ ...input.context, edges: input.edges }, registry)
  }
  if (!input.resetEdges?.length || input.resetEdges.some((edge) => !EDGES.includes(edge))) return failure('resetEdges', 'Padding reset requires valid edges')
  if (!state.padding.some((record) => JSON.stringify(record) === JSON.stringify(input.context))) return { valid: true }
  return { valid: true }
}

export function validatePaddingValue(value: unknown, units: readonly string[], path: string): PaddingValidationResult {
  if (value === 0) return { valid: true }
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('-') || !Number.isFinite(Number.parseFloat(value))) return failure(path, 'Padding must be numeric zero or a finite positive value with a unit')
  const unit = units.find((candidate) => value.endsWith(candidate))
  if (!unit || !PADDING_UNITS.includes(unit as never)) return failure(path, 'Padding unit is not approved')
  const number = value.slice(0, -unit.length)
  if (!number || !Number.isFinite(Number(number)) || Number(number) <= 0) return failure(path, 'Padding value must be positive')
  return { valid: true }
}

function validateContext(value: Record<string, unknown>, registry: FilamentRegistry, path: string): PaddingValidationResult {
  if (value.scope === 'global') return contextKeys(value, ['scope', 'edges'], path)
  if (value.scope === 'section') {
    const sections = new Set(registry.entries.flatMap((entry) => entry.paddingTargets ?? []).filter((target) => target.status === 'supported').map((target) => target.sectionId))
    if (typeof value.sectionId !== 'string' || !sections.has(value.sectionId)) return failure(`${path}.sectionId`, 'Padding section is unsupported', 'unsupported-target')
    return contextKeys(value, ['scope', 'sectionId', 'edges'], path)
  }
  if (value.scope !== 'component' && value.scope !== 'variant' && value.scope !== 'state') return failure(`${path}.scope`, 'Padding scope is invalid')
  if (typeof value.targetId !== 'string') return failure(`${path}.targetId`, 'Padding target is required')
  const target = registryTarget(value, registry)
  if (!target || target.status !== 'supported') return failure(`${path}.targetId`, 'Padding target is unsupported', 'unsupported-target')
  if (value.scope === 'component') return contextKeys(value, ['scope', 'targetId', 'edges'], path)
  if (value.scope === 'variant' && (!target.variants.includes(value.variantId as never) || typeof value.variantId !== 'string')) return failure(`${path}.variantId`, 'Padding variant is unsupported')
  if (value.scope === 'state' && (typeof value.stateId !== 'string' || !target.states.includes(value.stateId))) return failure(`${path}.stateId`, 'Padding state is unsupported')
  if (value.scope === 'state' && value.variantId !== undefined && (!target.variants.includes(value.variantId as never) || typeof value.variantId !== 'string')) return failure(`${path}.variantId`, 'Padding variant is unsupported')
  return contextKeys(value, value.scope === 'variant' ? ['scope', 'targetId', 'variantId', 'edges'] : ['scope', 'targetId', 'variantId', 'stateId', 'edges'], path)
}

function registryTarget(value: Record<string, unknown>, registry: FilamentRegistry) { return typeof value.targetId === 'string' ? registry.entries.flatMap((entry) => entry.paddingTargets ?? []).find((target) => target.id === value.targetId) : undefined }
function contextKeys(value: Record<string, unknown>, allowed: string[], path: string): PaddingValidationResult { return Object.keys(value).some((key) => unsafeKey(key) || !allowed.includes(key)) ? failure(path, 'Padding context keys do not match scope', 'scope-mismatch') : { valid: true } }
function failure(path: string, message: string, code = 'invalid-value'): PaddingValidationResult { return { valid: false, code, path, message } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function contextOf(record: PaddingRecord): PaddingContext { const { edges: _edges, ...context } = record; return context }

export function paddingEdges(value: PaddingEdges): PaddingEdge[] { return EDGES.filter((edge) => Object.prototype.hasOwnProperty.call(value, edge)) }
export type { PaddingContext }
