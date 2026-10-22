import type { PaddingTargetCatalog, PaddingTargetKind, PaddingTargetStatus, PaddingUnit, RegistryPaddingTarget } from '@/models/padding-registry.model'
import { PADDING_UNITS } from '@/models/padding-registry.model'
import { validateEvidenceArray, validateEvidenceCoverage } from '@/registry/padding-registry-validation-evidence'

const selectorPart = /^(?:[a-z][\w-]*(?:\.[\w-]+)*|\.[\w-]+(?:\.[\w-]+)*)(?::[\w-]+)?$/i
const allowedVariants = ['primary', 'outlined']
const allowedStates = ['disabled', 'hover', 'focus-visible']

export function validatePaddingCatalog(input: unknown): PaddingTargetCatalog {
  const root = record(input, 'catalog')
  onlyKeys(root, ['version', 'compatibility', 'targets'], 'catalog')
  if (root.version !== 1 || root.compatibility !== '5.9.0' || !Array.isArray(root.targets)) throw new Error('Invalid padding catalog schema')
  const ids = new Set<string>()
  const targets = root.targets.map((target) => validateTarget(target, ids))
  if (!targets.length) throw new Error('Padding catalog must contain targets')
  const orders = targets.filter((target) => target.status === 'supported').map((target) => target.order)
  if (orders.some((order) => order === undefined) || new Set(orders).size !== orders.length) throw new Error('Supported padding target order must be unique')
  return { version: 1, compatibility: '5.9.0', targets }
}

export function validatePaddingTarget(target: RegistryPaddingTarget, ids: Set<string>): void { validateTarget(target, ids) }

function validateTarget(input: unknown, ids: Set<string>): RegistryPaddingTarget {
  const target = record(input, 'padding target')
  onlyKeys(target, ['id', 'entryId', 'sectionId', 'nestedPolicy', 'order', 'selectors', 'targetKind', 'status', 'units', 'variants', 'states', 'variantSelectors', 'stateSelectors', 'evidence'], 'padding target')
  const id = requiredString(target.id, 'target ID')
  if (ids.has(id)) throw new Error(`Duplicate padding target ID: ${id}`)
  ids.add(id)
  const status = statusValue(target.status)
  const kind = kindValue(target.targetKind)
  const nestedPolicy = nestedValue(target.nestedPolicy)
  const selectors = stringArray(target.selectors, `${id} selectors`)
  const units = stringArray(target.units, `${id} units`)
  const variants = stringArray(target.variants, `${id} variants`)
  const states = stringArray(target.states, `${id} states`)
  const entryId = requiredString(target.entryId, `${id} entryId`)
  const sectionId = requiredString(target.sectionId, `${id} sectionId`)
  if (!status || !kind || !nestedPolicy) throw new Error(`Invalid padding metadata for ${id}`)
  if (!selectors.every(isSelector)) throw new Error(`Invalid padding selector for ${id}`)
  if (!unique(variants) || variants.some((value) => !allowedVariants.includes(value))) throw new Error(`Invalid padding variants for ${id}`)
  if (!unique(states) || states.some((value) => !allowedStates.includes(value))) throw new Error(`Invalid padding states for ${id}`)
  if (!unique(units) || !units.every(isPaddingUnit) || units.length !== PADDING_UNITS.length || !PADDING_UNITS.every((unit) => units.includes(unit))) throw new Error(`Invalid padding units for ${id}`)
  validateClassification(status, kind, nestedPolicy, selectors, target.order, id)
  const variantSelectors = selectorMap(target.variantSelectors, variants, `${id} variants`, status === 'supported')
  const stateSelectors = selectorMap(target.stateSelectors, states, `${id} states`, status === 'supported')
  const evidence = validateEvidenceArray(target.evidence, units, id)
  validateEvidenceCoverage(status, selectors, variantSelectors, stateSelectors, evidence, id)
  return { id, entryId, sectionId, nestedPolicy, order: typeof target.order === 'number' ? target.order : undefined, selectors, targetKind: kind, status, units: units.filter(isPaddingUnit), variants, states, variantSelectors, stateSelectors, evidence }
}

function validateClassification(status: PaddingTargetStatus, kind: PaddingTargetKind, policy: RegistryPaddingTarget['nestedPolicy'], selectors: readonly string[], order: unknown, id: string): void {
  if (status === 'supported' && ((!selectors.length) || (kind === 'leaf' && policy !== 'leaf-defaults') || (kind === 'container' && policy !== 'explicit-only') || !Number.isInteger(order) || Number(order) < 1)) throw new Error(`Invalid supported padding classification for ${id}`)
  if (status !== 'supported' && (selectors.length || policy !== 'none' || order !== undefined)) throw new Error(`Unmapped padding target cannot be active: ${id}`)
}

function selectorMap(input: unknown, ids: readonly string[], label: string, required: boolean): Record<string, readonly string[]> {
  const map = record(input, label)
  if (Object.keys(map).sort().join('|') !== [...ids].sort().join('|')) throw new Error(`Padding selector identity mismatch for ${label}`)
  return Object.fromEntries(ids.map((id) => { const selectors = stringArray(map[id], `${label}.${id}`); if ((required && !selectors.length) || !selectors.every(isSelector)) throw new Error(`Invalid padding selector mapping for ${label}.${id}`); return [id, selectors] }))
}

function record(value: unknown, label: string): Record<string, unknown> { if (!isRecord(value)) throw new Error(`Invalid ${label} schema`); return value }
function onlyKeys(value: Record<string, unknown>, keys: readonly string[], label: string): void { if (Object.keys(value).some((key) => !keys.includes(key))) throw new Error(`Invalid ${label} schema`) }
function stringArray(value: unknown, label: string): string[] { if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) throw new Error(`Invalid ${label}`); return value }
function requiredString(value: unknown, label: string): string { if (typeof value !== 'string' || !value.trim()) throw new Error(`Invalid ${label}`); return value }
function unique(values: readonly string[]): boolean { return values.length === new Set(values).size }
function isSelector(value: string): boolean { return value.startsWith('.fi-') && value.replace(/\s*>\s*/g, ' ').split(/\s+/).every((part) => selectorPart.test(part) && !part.includes('*')) }
function isPaddingUnit(value: string): value is PaddingUnit { return PADDING_UNITS.some((unit) => unit === value) }
function kindValue(value: unknown): PaddingTargetKind | null { return value === 'leaf' || value === 'container' ? value : null }
function statusValue(value: unknown): PaddingTargetStatus | null { return value === 'supported' || value === 'unmapped' || value === 'excluded' ? value : null }
function nestedValue(value: unknown): RegistryPaddingTarget['nestedPolicy'] | null { return value === 'leaf-defaults' || value === 'explicit-only' || value === 'none' ? value : null }
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value) }
