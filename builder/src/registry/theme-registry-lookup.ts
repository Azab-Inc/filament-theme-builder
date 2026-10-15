import type {
  FilamentRegistry,
  RegistryLookupEvidence,
  RegistryLookupResult,
} from '@/models/theme-registry.model'
import type { InspectorResolution, InspectorTargetEvidence } from '@/utils/inspector-protocol'
import { resolveInspectorTarget as resolveFromEvidence } from '@/utils/inspector-protocol'

const compatibilityPattern = /^(\d+)\.x$/
const versionPattern = /^(\d+)(?:\.\d+){0,2}$/

export function lookupRegistryEntry(
  registry: FilamentRegistry,
  evidence: RegistryLookupEvidence,
): RegistryLookupResult {
  const selectorSet = new Set(evidence.selectors)
  const candidates = registry.entries.filter((entry) =>
    entry.selectors.some((selector) => selectorSet.has(selector)),
  )
  if (candidates.length === 0) return { status: 'no-match' }
  const compatible = candidates.filter((entry) =>
    isCompatible(entry.filamentCompatibility, evidence.filamentVersion),
  )
  if (compatible.length === 0)
    return { status: 'incompatible', required: candidates[0]!.filamentCompatibility }
  if (compatible.length > 1)
    return { status: 'ambiguous', candidateIds: compatible.map(({ id }) => id).sort() }
  return { status: 'matched', entry: compatible[0]! }
}

export function resolveInspectorTarget(
  registry: FilamentRegistry,
  evidence: InspectorTargetEvidence,
): InspectorResolution {
  return resolveFromEvidence(registry, evidence)
}

function isCompatible(required: string, activeVersion: string): boolean {
  const requiredMajor = compatibilityPattern.exec(required)?.[1]
  const activeMajor = versionPattern.exec(activeVersion)?.[1]
  return requiredMajor !== undefined && requiredMajor === activeMajor
}
