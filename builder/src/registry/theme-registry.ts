import type {
  FilamentRegistry,
  RegistryEntry,
  RegistryLookupEvidence,
  RegistryLookupResult,
} from '@/models/theme-registry.model'
import type { InspectorResolution, InspectorTargetEvidence } from '@/utils/inspector-protocol'
import { createRegistryCatalog } from '@/registry/theme-registry-catalog'
import { lookupRegistryEntry as lookup } from '@/registry/theme-registry-lookup'
import { resolveInspectorTarget as resolveInspector } from '@/registry/theme-registry-lookup'
import { validateRegistry as validate } from '@/registry/theme-registry-validation'

export { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog'

export function createThemeRegistry(): FilamentRegistry {
  return validate(createRegistryCatalog())
}

export function validateRegistry(entries: readonly RegistryEntry[]): FilamentRegistry {
  return validate(entries)
}

export function lookupRegistryEntry(
  registry: FilamentRegistry,
  evidence: RegistryLookupEvidence,
): RegistryLookupResult {
  return lookup(registry, evidence)
}

export function resolveInspectorTarget(
  registry: FilamentRegistry,
  evidence: InspectorTargetEvidence,
): InspectorResolution {
  return resolveInspector(registry, evidence)
}
