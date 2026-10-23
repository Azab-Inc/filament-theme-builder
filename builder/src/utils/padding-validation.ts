import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { PaddingEdges, PaddingRecord, PaddingValidationResult } from '@/models/padding.model'
import type { PaddingEdge } from '@/models/padding-registry.model'
import { PADDING_UNITS } from '@/models/padding-registry.model'
import { paddingContextIdentity, paddingRecordContext } from '@/utils/padding-identity'
import { isSafePropertyValue } from '@/utils/raw-override-property-validation'

const EDGES: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']
const unsafeKey = (key: string) => key === '__proto__' || key === 'constructor' || key === 'prototype'

export function validatePaddingState(value: unknown, registry: FilamentRegistry): PaddingValidationResult {
  if (!Array.isArray(value)) return failure('padding', 'Padding must be an array')
  const identities = new Set<string>()
  for (const [index, record] of value.entries()) {
    const result = validatePaddingRecord(record, registry, `padding[${index}]`)
    if (!result.valid) return result
    const identity = paddingContextIdentity(paddingRecordContext(result.record!))
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
  if (edgeKeys.some(unsafeKey) || edgeKeys.some((edge) => !isPaddingEdge(edge))) return failure(`${path}.edges`, 'Padding edge is unknown', 'unknown-key')
  for (const edge of edgeKeys) {
    const result = validatePaddingValue(value.edges[edge], registryTarget(value, registry)?.units ?? PADDING_UNITS, `${path}.edges.${edge}`)
    if (!result.valid) return result
  }
  if (!edgeKeys.length) return failure(`${path}.edges`, 'Padding edges cannot be empty')
  return { valid: true, record: value as PaddingRecord }
}

export function validatePaddingContext(context: unknown, registry: FilamentRegistry, path = 'context'): PaddingValidationResult {
  if (!isRecord(context)) return failure(path, 'Padding context must be an object')
  if (Object.prototype.hasOwnProperty.call(context, 'edges')) return failure(path, 'Padding context must not contain edges', 'scope-mismatch')
  return validateContext({ ...context, edges: { top: 0 } }, registry, path)
}

export function validatePaddingMutation(input: unknown, state: { padding: PaddingRecord[] }, registry: FilamentRegistry): PaddingValidationResult {
  if (!isRecord(input) || !isRecord(input.context) || typeof input.operation !== 'string') return failure('mutation', 'Padding mutation must be an object')
  const context = validatePaddingContext(input.context, registry)
  if (!context.valid) return context
  if (input.operation === 'set') {
    if (!allowedKeys(input, ['operation', 'context', 'edges']) || !isRecord(input.edges) || !Object.keys(input.edges).length) return failure('mutation', 'Set mutations require only edges')
    return validatePaddingRecord({ ...input.context, edges: input.edges }, registry)
  }
  if (input.operation !== 'reset' || !allowedKeys(input, ['operation', 'context', 'resetEdges']) || !Array.isArray(input.resetEdges) || !input.resetEdges.length || input.resetEdges.some((edge) => !isPaddingEdge(edge)) || new Set(input.resetEdges).size !== input.resetEdges.length) return failure('mutation', 'Reset mutations require unique resetEdges only')
  return { valid: true }
}

export function validatePaddingValue(value: unknown, units: readonly string[], path: string): PaddingValidationResult {
  if (value === 0 || value === '0') return { valid: true }
  if (typeof value !== 'string') return failure(path, 'Padding must be numeric zero or a finite positive value with a unit')
  if (!isSafePropertyValue('padding', value)) return failure(path, 'Padding is not an approved raw property value')
  const unitPattern = units.filter((unit) => PADDING_UNITS.some((allowed) => allowed === unit)).sort((left, right) => right.length - left.length).join('|')
  const match = new RegExp(`^(0|(?:0|[1-9]\\d*)(?:\\.\\d+)?)(?:${unitPattern})$`).exec(value)
  if (!match || !Number.isFinite(Number(match[1]))) return failure(path, 'Padding must use an approved unit and CSS number')
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
  if (value.scope === 'variant' && (typeof value.variantId !== 'string' || !target.variants.some((variant) => variant === value.variantId))) return failure(`${path}.variantId`, 'Padding variant is unsupported')
  if (value.scope === 'state' && (typeof value.stateId !== 'string' || !target.states.some((state) => state === value.stateId))) return failure(`${path}.stateId`, 'Padding state is unsupported')
  if (value.scope === 'state' && value.variantId !== undefined && (typeof value.variantId !== 'string' || !target.variants.some((variant) => variant === value.variantId))) return failure(`${path}.variantId`, 'Padding variant is unsupported')
  return contextKeys(value, value.scope === 'variant' ? ['scope', 'targetId', 'variantId', 'edges'] : ['scope', 'targetId', 'variantId', 'stateId', 'edges'], path)
}

function registryTarget(value: Record<string, unknown>, registry: FilamentRegistry) { return typeof value.targetId === 'string' ? registry.entries.flatMap((entry) => entry.paddingTargets ?? []).find((target) => target.id === value.targetId) : undefined }
function contextKeys(value: Record<string, unknown>, allowed: string[], path: string): PaddingValidationResult { return Object.keys(value).some((key) => unsafeKey(key) || !allowed.includes(key)) ? failure(path, 'Padding context keys do not match scope', 'scope-mismatch') : { valid: true } }
function failure(path: string, message: string, code = 'invalid-value'): PaddingValidationResult { return { valid: false, code, path, message } }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function isPaddingEdge(value: unknown): value is PaddingEdge { return typeof value === 'string' && EDGES.some((edge) => edge === value) }
function allowedKeys(value: Record<string, unknown>, keys: string[]): boolean { return Object.keys(value).every((key) => keys.includes(key)) }
export function paddingEdges(value: PaddingEdges): PaddingEdge[] { return EDGES.filter((edge) => Object.prototype.hasOwnProperty.call(value, edge)) }
