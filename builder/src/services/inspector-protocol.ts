import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'

export const INSPECTOR_PROTOCOL_VERSION = 1 as const

export type InspectorTargetEvidence = {
  candidateSelectors: string[]
  classNames: string[]
  semanticBreadcrumb?: string
  componentId?: string
  variantId?: string
  stateId?: string
}

export type InspectorCommand =
  | { type: 'ftb:inspector:enable'; protocolVersion: 1 }
  | { type: 'ftb:inspector:disable'; protocolVersion: 1 }

export type InspectorEvent =
  | { type: 'ftb:inspector:ready'; protocolVersion: 1 }
  | { type: 'ftb:inspector:hover' | 'ftb:inspector:select'; protocolVersion: 1; target: InspectorTargetEvidence }
  | { type: 'ftb:inspector:clear'; protocolVersion: 1 }

export type InspectorResolution =
  | { status: 'editable'; entry: RegistryEntry; editorTarget: string; breadcrumb: string }
  | { status: 'selector-only'; entry: RegistryEntry; breadcrumb: string }
  | { status: 'no-match'; breadcrumb: string }
  | { status: 'ambiguous' | 'incompatible'; breadcrumb: string; candidateIds?: string[]; required?: string }

const selectorPattern = /^(?:\.fi-[A-Za-z0-9_-]+)(?:\s+\.fi-[A-Za-z0-9_-]+)*$/
const classPattern = /^fi-[A-Za-z0-9_-]+$/
const breadcrumbPattern = /^[^<>]{1,200}$/
const allowedTargetKeys = ['candidateSelectors', 'classNames', 'semanticBreadcrumb', 'componentId', 'variantId', 'stateId'] as const
const editableTargets = new Set(['form.product-name'])

export function isInspectorCommand(value: unknown): value is InspectorCommand {
  if (!isRecord(value) || value.protocolVersion !== INSPECTOR_PROTOCOL_VERSION) return false
  if (value.type !== 'ftb:inspector:enable' && value.type !== 'ftb:inspector:disable') return false
  return Object.keys(value).length === 2
}

export function isInspectorEvent(value: unknown): value is InspectorEvent {
  if (!isRecord(value) || value.protocolVersion !== INSPECTOR_PROTOCOL_VERSION || typeof value.type !== 'string') return false
  if (value.type === 'ftb:inspector:ready' || value.type === 'ftb:inspector:clear') return Object.keys(value).length === 2
  if (value.type !== 'ftb:inspector:hover' && value.type !== 'ftb:inspector:select') return false
  return Object.keys(value).length === 3 && isInspectorTargetEvidence(value.target)
}

export function isInspectorTargetEvidence(value: unknown): value is InspectorTargetEvidence {
  if (!isRecord(value) || !Array.isArray(value.candidateSelectors) || !Array.isArray(value.classNames)) return false
  if (Object.keys(value).some((key) => !(allowedTargetKeys as readonly string[]).includes(key))) return false
  if (value.candidateSelectors.length > 20 || value.classNames.length > 30) return false
  if (value.candidateSelectors.some((selector) => typeof selector !== 'string' || !selectorPattern.test(selector))) return false
  if (value.classNames.some((className) => typeof className !== 'string' || !classPattern.test(className))) return false
  for (const key of ['componentId', 'variantId', 'stateId'] as const) {
    if (value[key] !== undefined && (typeof value[key] !== 'string' || !classPattern.test(value[key]))) return false
  }
  return value.semanticBreadcrumb === undefined || (typeof value.semanticBreadcrumb === 'string' && breadcrumbPattern.test(value.semanticBreadcrumb))
}

export function resolveInspectorTarget(registry: FilamentRegistry, evidence: InspectorTargetEvidence): InspectorResolution {
  for (const selector of evidence.candidateSelectors) {
    const result = registry.entries.find((entry) => entry.selectors.includes(selector))
    if (!result) continue
    if (editableTargets.has(result.id) && result.controls.length > 0) {
      return { status: 'editable', entry: result, editorTarget: result.id, breadcrumb: result.label }
    }
    return { status: 'selector-only', entry: result, breadcrumb: evidence.semanticBreadcrumb ?? result.label }
  }
  return { status: 'no-match', breadcrumb: evidence.semanticBreadcrumb ?? 'Detected preview element' }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
