import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import type { PaddingTargetCatalog } from '@/models/padding-registry.model'
export { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog-constants'
import { coreRegistryEntries } from '@/registry/theme-registry-catalog-core'
import { formRegistryEntries } from '@/registry/theme-registry-catalog-forms'
import { showcaseRegistryEntries } from '@/registry/theme-registry-catalog-showcases'
import paddingCatalog from '@/registry/filament-padding-targets.json'
import { validatePaddingCatalog, validatePaddingTarget } from '@/registry/padding-registry-validation'

const validatedPaddingCatalog = validatePaddingCatalog(paddingCatalog)

export function attachPaddingTargets(
  entries: readonly RegistryEntry[],
  catalog: PaddingTargetCatalog,
): readonly RegistryEntry[] {
  const entryIds = new Set(entries.map((entry) => entry.id))
  if (catalog.targets.some((target) => !entryIds.has(target.entryId))) throw new Error('Padding target owner entry is unknown')
  const paddingIds = new Set<string>()
  catalog.targets.forEach((target) => validatePaddingTarget(target, paddingIds))
  return entries.map((entry) => {
    const paddingTargets = catalog.targets.filter((target) => target.entryId === entry.id)
    return paddingTargets.length ? { ...entry, paddingTargets } : entry
  })
}

export function createRegistryCatalog(): readonly RegistryEntry[] {
  const entries = [
    ...coreRegistryEntries,
    ...formRegistryEntries,
    ...showcaseRegistryEntries,
  ] satisfies FilamentRegistry['entries']
  return attachPaddingTargets(entries, validatedPaddingCatalog)
}
