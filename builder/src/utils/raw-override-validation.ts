import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { InspectorTargetEvidence } from '@/utils/inspector-protocol'
import type { RawValidationResult } from '@/models/raw-validation-result.model'
import { SUPPORTED_PSEUDO_STATES } from '@/models/theme-registry.model'
import {
  ALL_RAW_VISUAL_PROPERTIES,
  type RawElementOverride,
  type RawSelectorProposal,
  type RawVisualProperty,
} from '@/models/raw-overrides.model'
import { isSafePropertyValue } from '@/utils/raw-override-property-validation'
import { findEditableSameTargetMatch } from '@/utils/inspector-target-matching'

export type { RawValidationResult } from '@/models/raw-validation-result.model'

export { ALL_RAW_VISUAL_PROPERTIES }

const pseudoStatesPattern = SUPPORTED_PSEUDO_STATES.join('|')
const selectorPattern = new RegExp(`^(?:\\.fi-[A-Za-z0-9_-]+)(?:\\.[A-Za-z0-9_-]+)*(?::(?:${pseudoStatesPattern}))?(?:\\s+\\.fi-[A-Za-z0-9_-]+(?:\\.[A-Za-z0-9_-]+)*(?::(?:${pseudoStatesPattern}))?)*$`)
const singleClassPattern = /^\.fi-[A-Za-z0-9_-]+$/
export function validateRawSelector(value: unknown): RawValidationResult<string> {
  if (typeof value !== 'string' || !selectorPattern.test(value)) {
    return { valid: false, error: 'Selector must contain only safe .fi-* class selectors and limited pseudo-classes' }
  }
  return { valid: true, value }
}

export function classifyRawSelector(selector: string): RawSelectorProposal {
  const validation = validateRawSelector(selector)
  if (!validation.valid) return { selector: null, quality: 'unavailable', warning: validation.error }
  if (singleClassPattern.test(selector)) return { selector, quality: 'stable' }
  return { selector, quality: 'fragile', warning: 'This selector depends on multiple classes or a state and may be fragile.' }
}

export function proposeRawSelector(evidence: InspectorTargetEvidence, registry: FilamentRegistry): RawSelectorProposal {
  const candidates = [...new Set(evidence.candidateSelectors)]
  if (evidence.targetSelector === null) return { selector: null, quality: 'unavailable', warning: 'No safe editable selector was detected.' }
  if (evidence.targetSelector) {
    const canonicalSameTarget = findEditableSameTargetMatch(registry, evidence)
    return classifyRawSelector(canonicalSameTarget?.selector ?? evidence.targetSelector)
  }
  const semanticSelectors = new Set(registry.entries.flatMap((entry) => entry.selectors))
  const stableSemantic = candidates.find((candidate) => singleClassPattern.test(candidate) && semanticSelectors.has(candidate))
  if (stableSemantic) return { selector: stableSemantic, quality: 'stable' }
  const stable = candidates.find((candidate) => singleClassPattern.test(candidate))
  if (stable) return { selector: stable, quality: 'stable' }
  const safe = candidates.find((candidate) => validateRawSelector(candidate).valid)
  return safe ? classifyRawSelector(safe) : { selector: null, quality: 'unavailable', warning: 'No safe editable selector was detected.' }
}

export function validateRawElementOverride(value: unknown): RawValidationResult {
  if (!isRecord(value) || Object.keys(value).some((key) => !['selector', 'properties'].includes(key))) {
    return { valid: false, error: 'Raw override contains unsupported keys' }
  }
  const selector = validateRawSelector(value.selector)
  if (!selector.valid) return selector
  if (!isRecord(value.properties) || Object.keys(value.properties).length === 0) {
    return { valid: false, error: 'Raw override requires at least one property' }
  }
  for (const [property, propertyValue] of Object.entries(value.properties)) {
    if (!(ALL_RAW_VISUAL_PROPERTIES as readonly string[]).includes(property)) return { valid: false, error: `Unsupported raw property: ${property}` }
    if (!isSafePropertyValue(property as RawVisualProperty, propertyValue)) return { valid: false, error: `Invalid value for ${property}` }
  }
  return { valid: true, value: JSON.parse(JSON.stringify(value)) as RawElementOverride }
}

export function validateRawOverrides(value: unknown): RawValidationResult<RawElementOverride[]> {
  if (!Array.isArray(value)) return { valid: false, error: 'Raw overrides must be an array' }
  const selectors = new Set<string>()
  const overrides: RawElementOverride[] = []
  for (const candidate of value) {
    const result = validateRawElementOverride(candidate)
    if (!result.valid) return result
    if (selectors.has(result.value.selector)) return { valid: false, error: `Duplicate raw selector: ${result.value.selector}` }
    selectors.add(result.value.selector)
    overrides.push(result.value)
  }
  return { valid: true, value: overrides }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
