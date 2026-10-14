import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { InspectorTargetEvidence } from '@/services/inspector-protocol'
import {
  ALL_RAW_VISUAL_PROPERTIES,
  type RawElementOverride,
  type RawSelectorProposal,
  type RawVisualProperty,
} from '@/models/raw-overrides.model'

export { ALL_RAW_VISUAL_PROPERTIES }

export type RawValidationResult<T = RawElementOverride> =
  | { valid: true; value: T }
  | { valid: false; error: string }

const selectorPattern = /^(?:\.fi-[A-Za-z0-9_-]+)(?:\.[A-Za-z0-9_-]+)*(?::(?:hover|focus|active|disabled|checked|focus-visible|focus-within))?(?:\s+\.fi-[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*(?::(?:hover|focus|active|disabled|checked|focus-visible|focus-within))?)*$/
const singleClassPattern = /^\.fi-[A-Za-z0-9_-]+$/
const colorPattern = /^(?:#[\da-f]{3,8}|(?:rgb|hsl|hwb|lab|lch|oklab|oklch)a?\([^;{}()]+\)|transparent|var\(--(?:color-)?(?:primary|success|warning|danger|info|gray)(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?\))$/i
const lengthToken = '(?:0|(?:0|[1-9]\\d{0,3})(?:\\.\\d+)?(?:px|rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|%)?)'
const lengthPattern = new RegExp(`^${lengthToken}$`, 'i')
const spacingPattern = new RegExp(`^${lengthToken}(?:\\s+${lengthToken}){0,3}$`, 'i')
const shadowLength = '(?:0|-?\\d+(?:\\.\\d+)?(?:px|rem|em))'
const shadowPattern = new RegExp(`^(?:none|(?:inset\\s+)?${shadowLength}(?:\\s+${shadowLength}){1,3}(?:\\s+(?:#[\\da-f]{3,8}|rgba?\\([^;{}()]+\\)|transparent))?)$`, 'i')
const familyPattern = /^(?:[A-Za-z][A-Za-z0-9 _.-]{0,63})(?:\s*,\s*(?:[A-Za-z][A-Za-z0-9 _.-]{0,63}))*$/

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
  return { valid: true, value: structuredClone(value) as RawElementOverride }
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

function isSafePropertyValue(property: RawVisualProperty, value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 300 || /[;{}<>]|\/\*|\*\/|url\s*\(|@(?:import|supports|media|layer|font-face)|expression\s*\(|javascript\s*:/i.test(value)) return false
  switch (property) {
    case 'color':
    case 'background-color':
    case 'border-color':
      return colorPattern.test(value)
    case 'border-width':
    case 'border-radius':
    case 'font-size':
    case 'letter-spacing':
      return lengthPattern.test(value)
    case 'padding':
    case 'margin':
      return spacingPattern.test(value)
    case 'box-shadow':
      return shadowPattern.test(value.trim())
    case 'opacity': {
      const numeric = Number(value)
      return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1 && /^\d+(?:\.\d+)?$/.test(value)
    }
    case 'font-family':
      return familyPattern.test(value)
    case 'font-weight':
      return /^(?:normal|bold|(?:100|200|300|400|500|600|700|800|900))$/.test(value)
    case 'line-height':
      return /^(?:normal|(?:0|\d+(?:\.\d+)?)(?:px|rem|em|%)?)$/.test(value)
    case 'text-decoration':
      return /^(?:none|underline|overline|line-through)$/.test(value)
    case 'border-style':
      return /^(?:none|solid|dashed|dotted|double)$/.test(value)
    case 'text-align':
      return /^(?:left|right|center|justify|start|end)$/.test(value)
    case 'white-space':
      return /^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/.test(value)
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
