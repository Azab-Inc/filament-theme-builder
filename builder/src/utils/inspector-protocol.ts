import type { FilamentRegistry } from '@/models/theme-registry.model'
import { SUPPORTED_PSEUDO_STATES } from '@/models/theme-registry.model'
import type { InspectorCommand } from '@/models/inspector-command.model'
import type { InspectorEvent } from '@/models/inspector-event.model'
import type { InspectorResolution } from '@/models/inspector-resolution.model'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'

export type { InspectorCommand } from '@/models/inspector-command.model'
export type { InspectorEvent } from '@/models/inspector-event.model'
export type { InspectorResolution } from '@/models/inspector-resolution.model'
export type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'

export const INSPECTOR_PROTOCOL_VERSION = 1 as const

const pseudoStatesPattern = SUPPORTED_PSEUDO_STATES.join('|')
const selectorPattern = new RegExp(`^(?:\\.fi-[A-Za-z0-9_-]+)(?:\\.[A-Za-z0-9_-]+)*(?::(?:${pseudoStatesPattern}))?(?:\\s+\\.fi-[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*(?::(?:${pseudoStatesPattern}))?)*$`)
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
