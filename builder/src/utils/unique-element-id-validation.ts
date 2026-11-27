import type { UniqueElementIdAssignment } from '@/models/unique-element-id-assignment.model'

export const MAX_UNIQUE_ELEMENT_ID_ASSIGNMENTS = 100
export const MAX_UNIQUE_ELEMENT_MATCH_INDEX = 999
export const UNIQUE_ELEMENT_ID_PATTERN = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/

const reservedIds = new Set(['ftb-preview-bridge', 'ftb-managed-theme', 'ftb-inspector-style'])

export type UniqueElementIdValidationResult = { valid: true; value: UniqueElementIdAssignment } | { valid: false; error: string }

export function validateUniqueElementId(value: unknown): string | null {
  if (typeof value !== 'string' || !UNIQUE_ELEMENT_ID_PATTERN.test(value)) return 'ID must start with a letter and contain at most 64 safe characters.'
  if (reservedIds.has(value)) return 'This ID is reserved by the builder.'
  return null
}

export function validateUniqueElementIdAssignment(value: unknown): UniqueElementIdValidationResult {
  if (!isRecord(value) || Object.keys(value).some((key) => !['id', 'sourceSelector', 'matchIndex'].includes(key))) return { valid: false, error: 'Unique element ID assignment contains unsupported fields.' }
  const idError = validateUniqueElementId(value.id)
  if (idError) return { valid: false, error: idError }
  const sourceSelector = value.sourceSelector
  const matchIndex: unknown = value.matchIndex
  if (typeof sourceSelector !== 'string' || !/^\.fi-[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?:\s+\.fi-[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*)*$/.test(sourceSelector)) return { valid: false, error: 'Assignment source selector is unsafe.' }
  if (typeof matchIndex !== 'number' || !Number.isSafeInteger(matchIndex) || matchIndex < 0 || matchIndex > MAX_UNIQUE_ELEMENT_MATCH_INDEX) return { valid: false, error: 'Assignment match index is out of bounds.' }
  if (typeof value.id !== 'string') return { valid: false, error: 'Assignment ID is invalid.' }
  return { valid: true, value: { id: value.id, sourceSelector, matchIndex } }
}

export function validateUniqueElementIdAssignments(value: unknown): { valid: true; value: UniqueElementIdAssignment[] } | { valid: false; error: string } {
  if (!Array.isArray(value) || value.length > MAX_UNIQUE_ELEMENT_ID_ASSIGNMENTS) return { valid: false, error: 'Unique element ID assignments exceed the supported limit.' }
  const ids = new Set<string>()
  const identities = new Set<string>()
  const assignments: UniqueElementIdAssignment[] = []
  for (const candidate of value) {
    const result = validateUniqueElementIdAssignment(candidate)
    if (!result.valid) return result
    const identity = `${result.value.sourceSelector}\u0000${result.value.matchIndex}`
    if (ids.has(result.value.id)) return { valid: false, error: `Duplicate unique element ID: ${result.value.id}` }
    if (identities.has(identity)) return { valid: false, error: 'Duplicate unique element target.' }
    ids.add(result.value.id); identities.add(identity); assignments.push(result.value)
  }
  return { valid: true, value: assignments }
}

export function generateUniqueElementId(sourceSelector: string, matchIndex: number, existingIds: ReadonlySet<string> = new Set()): string {
  const base = `ftb-${sourceSelector.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase()}-${matchIndex + 1}`.slice(0, 64)
  let candidate = base || 'ftb-element-1'
  let suffix = 2
  while (existingIds.has(candidate) || reservedIds.has(candidate)) candidate = `${base.slice(0, 64 - String(suffix).length - 1)}-${suffix++}`
  return candidate
}

export function uniqueElementIdSelector(id: string): string { return `#${id}` }

function isRecord(value: unknown): value is Record<string, unknown> { return value !== null && typeof value === 'object' && !Array.isArray(value) }
