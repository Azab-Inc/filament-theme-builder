import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'

const selectorClassPattern = /\.fi-[A-Za-z0-9_-]+/g
const editableTargetIds = new Set(['form.product-name'])

export function isEditableInspectorTarget(entry: RegistryEntry): boolean {
  return editableTargetIds.has(entry.id) && entry.controls.length > 0
}

export function findSameTargetRegistryMatches(registry: FilamentRegistry, evidence: InspectorTargetEvidence) {
  if (!evidence.targetSelector) return []
  const targetClasses: string[] = evidence.targetSelector.match(selectorClassPattern) ?? []
  if (targetClasses.length === 0) return []

  const identifiesTarget = (selector: string) => {
    const selectorParts = selector.trim().split(/\s+/)
    const terminal = selectorParts[selectorParts.length - 1] ?? ''
    const terminalClasses: string[] = terminal.match(selectorClassPattern) ?? []
    return targetClasses.some((className) => terminalClasses.includes(className))
  }
  const matches: Array<{ selector: string; entry: RegistryEntry }> = []
  const addMatch = (match: { selector: string; entry: RegistryEntry }) => {
    if (!matches.some((candidate) => candidate.selector === match.selector)) matches.push(match)
  }
  for (const selector of evidence.candidateSelectors) {
    if (selector === evidence.targetSelector || !identifiesTarget(selector)) continue
    const entry = registry.entries.find((candidate) => candidate.selectors.includes(selector))
    if (entry) addMatch({ selector, entry })
  }
  return matches
}

export function findEditableSameTargetMatch(registry: FilamentRegistry, evidence: InspectorTargetEvidence) {
  return findSameTargetRegistryMatches(registry, evidence).find(({ entry }) => isEditableInspectorTarget(entry))
}
