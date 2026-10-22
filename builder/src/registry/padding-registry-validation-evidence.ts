import type { PaddingEdge, PaddingEvidence, PaddingTargetStatus } from '@/models/padding-registry.model'
import { isSafePropertyValue } from '@/utils/raw-override-property-validation'

const selectorPart = /^(?:[a-z][\w-]*(?:\.[\w-]+)*|\.[\w-]+(?:\.[\w-]+)*)(?::[\w-]+)?$/i
const oneTokenPattern = /^(?:0|(?:0|[1-9]\d*)(?:\.\d+)?(?:px|rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|%))$/

export function validateEvidenceArray(input: unknown, units: readonly string[], id: string): PaddingEvidence[] { return Array.isArray(input) && input.length ? input.map((item) => evidence(item, units, id)) : fail(`Padding evidence required for ${id}`) }

export function validateEvidenceCoverage(status: PaddingTargetStatus, selectors: readonly string[], variants: Readonly<Record<string, readonly string[]>>, states: Readonly<Record<string, readonly string[]>>, evidence: readonly PaddingEvidence[], id: string): void {
  if (status !== 'supported') return
  const declared = new Set([ ...selectors, ...Object.values(variants).flat(), ...Object.values(states).flat() ])
  const verified = new Set(evidence.filter((item): item is PaddingEvidence & { selector: string } => item.verified && item.selector !== undefined).map((item) => item.selector))
  if ([...declared].some((selector) => !verified.has(selector)) || [...verified].some((selector) => !declared.has(selector))) throw new Error(`Padding evidence mapping mismatch for ${id}`)
}

function evidence(input: unknown, units: readonly string[], id: string): PaddingEvidence {
  const item = record(input, `${id} evidence`)
  onlyKeys(item, ['selector', 'source', 'sampleCount', 'verified', 'values', 'reason'], `${id} evidence`)
  const verified = item.verified === true || item.verified === false ? item.verified : fail(`Invalid evidence state for ${id}`)
  const source = requiredString(item.source, `${id} evidence source`)
  if (!verified) { if (item.selector !== undefined || item.sampleCount !== undefined || !requiredString(item.reason, `${id} unverified reason`)) throw new Error(`Unverified evidence must omit selector/count for ${id}`); return { source, verified: false, reason: requiredString(item.reason, `${id} reason`) } }
  const selector = requiredString(item.selector, `${id} evidence selector`)
  const sampleCount = typeof item.sampleCount === 'number' && Number.isInteger(item.sampleCount) && item.sampleCount > 0 ? item.sampleCount : fail(`Invalid evidence count for ${id}`)
  if (!isSelector(selector)) throw new Error(`Invalid evidence selector for ${id}`)
  return { selector, source, sampleCount, verified: true, values: edgeValues(item.values, units, id) }
}

function edgeValues(input: unknown, units: readonly string[], id: string): Partial<Record<PaddingEdge, string>> {
  const values = record(input, `${id} evidence values`)
  onlyKeys(values, ['top', 'right', 'bottom', 'left'], `${id} evidence values`)
  const result: Partial<Record<PaddingEdge, string>> = {}
  const edges: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']
  for (const edge of edges) { const value = values[edge]; if (typeof value !== 'string' || !units.includes(value === '0' ? 'px' : value.replace(/^.*?(px|rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|%)$/, '$1')) || !oneTokenPattern.test(value) || !isSafePropertyValue('padding', value)) throw new Error(`Invalid padding unit/edge value for ${id}.${edge}`); result[edge] = value }
  return result
}

function record(value: unknown, label: string): Record<string, unknown> { if (!isRecord(value)) throw new Error(`Invalid ${label} schema`); return value }
function onlyKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void { if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error(`Invalid ${label} schema`) }
function requiredString(value: unknown, label: string): string { if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${label}`); return value }
function isSelector(value: string): boolean { return value.startsWith('.fi-') && value.replace(/\s*>\s*/g, ' ').split(/\s+/).every((part) => selectorPart.test(part) && !part.includes('*')) }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function fail(message: string): never { throw new Error(message) }
