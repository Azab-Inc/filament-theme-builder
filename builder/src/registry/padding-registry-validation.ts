import type { PaddingEdge, PaddingEvidence, PaddingTargetCatalog, PaddingTargetKind, PaddingTargetStatus, RegistryPaddingTarget } from '@/models/padding-registry.model'

const selectorPart = /^(?:[a-z][\w-]*(?:\.[\w-]+)*|\.[\w-]+(?:\.[\w-]+)*)(?::[\w-]+)?$/i
const valuePattern = /^(?:0|(?:0|[1-9]\d*)(?:\.\d+)?(?:px|rem|em|%|vh|vw))$/

export function validatePaddingCatalog(input: unknown): PaddingTargetCatalog {
  if (!isRecord(input) || input.version !== 1 || input.compatibility !== '5.9.0' || !Array.isArray(input.targets)) throw new Error('Invalid padding catalog')
  const ids = new Set<string>()
  const targets = input.targets.map((target) => validateTarget(target, ids))
  if (!targets.length) throw new Error('Padding catalog must contain targets')
  return { version: 1, compatibility: '5.9.0', targets }
}

export function validatePaddingTarget(target: RegistryPaddingTarget, ids: Set<string>): void {
  validateTarget(target, ids)
}

function validateTarget(input: unknown, ids: Set<string>): RegistryPaddingTarget {
  if (!isRecord(input)) throw new Error('Invalid padding target')
  const id = stringValue(input.id)
  if (!id || ids.has(id)) throw new Error(`Duplicate padding target ID: ${id || 'empty'}`)
  ids.add(id)
  const entryId = stringValue(input.entryId)
  const selectors = stringArray(input.selectors)
  const variants = stringArray(input.variants)
  const states = stringArray(input.states)
  const units = stringArray(input.units)
  const targetKind = targetKindValue(input.targetKind)
  const status = targetStatusValue(input.status)
  if (!entryId) throw new Error(`Invalid padding entry for ${id}`)
  if (!selectors.every(isSelector)) throw new Error(`Invalid padding selector for ${id}`)
  if (!unique(variants)) throw new Error(`Invalid padding variants for ${id}`)
  if (!unique(states)) throw new Error(`Invalid padding states for ${id}`)
  if (!unique(units) || units.some((unit) => !isPaddingUnit(unit))) throw new Error(`Invalid padding unit for ${id}`)
  if (!targetKind || !status) throw new Error(`Invalid padding metadata for ${id}`)
  const evidence = Array.isArray(input.evidence) ? input.evidence.map((item) => validateEvidence(item, units, id)) : []
  if (!evidence.length || (status === 'supported' && !evidence.some((item) => item.verified))) throw new Error(`Padding evidence required for ${id}`)
  if (status === 'supported' && !selectors.length) throw new Error(`Supported padding target requires selectors: ${id}`)
  return { id, entryId, selectors, targetKind, status, units: units.filter(isPaddingUnit), variants, states, evidence }
}

function validateEvidence(input: unknown, units: readonly string[], targetId: string): PaddingEvidence {
  if (!isRecord(input)) throw new Error(`Invalid padding evidence for ${targetId}`)
  const selector = stringValue(input.selector)
  const source = stringValue(input.source)
  const sampleCount = typeof input.sampleCount === 'number' ? input.sampleCount : 0
  const verified = typeof input.verified === 'boolean' ? input.verified : null
  const reason = input.reason === undefined ? undefined : stringValue(input.reason)
  if (!isSelector(selector) || !source || !Number.isInteger(sampleCount) || sampleCount < 1 || verified === null) throw new Error(`Invalid padding evidence for ${targetId}`)
  const values = input.values === undefined ? undefined : readValues(input.values, units, targetId)
  if (!verified && !reason) throw new Error(`Unverified padding evidence needs a reason for ${targetId}`)
  return { selector, source, sampleCount, verified, values, reason }
}

function readValues(input: unknown, units: readonly string[], targetId: string): Partial<Record<PaddingEdge, string>> {
  if (!isRecord(input)) throw new Error(`Invalid padding unit for ${targetId}`)
  const values: Partial<Record<PaddingEdge, string>> = {}
  const edges: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']
  for (const key of edges) {
    const value = input[key]
    if (value !== undefined && (typeof value !== 'string' || !valuePattern.test(value) || (value !== '0' && !units.some((unit) => value.endsWith(unit))))) throw new Error(`Invalid padding unit for ${targetId}`)
    if (typeof value === 'string') values[key] = value
  }
  return values
}

function isSelector(value: string): boolean { return value.startsWith('.fi-') && value.replace(/\s*>\s*/g, ' ').split(/\s+/).every((part) => selectorPart.test(part) && !part.includes('*')) }
function unique(values: readonly string[]): boolean { return values.length === new Set(values).size && values.every((value) => value.trim().length > 0) }
function stringArray(value: unknown): string[] { return Array.isArray(value) && value.every((item) => typeof item === 'string') ? value : [] }
function stringValue(value: unknown): string { return typeof value === 'string' ? value : '' }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
function targetKindValue(value: unknown): PaddingTargetKind | null { return value === 'leaf' || value === 'container' ? value : null }
function targetStatusValue(value: unknown): PaddingTargetStatus | null { return value === 'supported' || value === 'unmapped' || value === 'excluded' ? value : null }
function isPaddingUnit(value: string): value is 'px' | 'rem' | 'em' | '%' | 'vh' | 'vw' { return ['px', 'rem', 'em', '%', 'vh', 'vw'].includes(value) }
