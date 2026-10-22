import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
export { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog-constants'
import { coreRegistryEntries } from '@/registry/theme-registry-catalog-core'
import { formRegistryEntries } from '@/registry/theme-registry-catalog-forms'
import { showcaseRegistryEntries } from '@/registry/theme-registry-catalog-showcases'
import paddingCatalog from '@/registry/filament-padding-targets.json'
import { validatePaddingCatalog } from '@/registry/padding-registry-validation'

const validatedPaddingCatalog = validatePaddingCatalog(paddingCatalog)

export function createRegistryCatalog(): readonly RegistryEntry[] {
  const entries = [
    ...coreRegistryEntries,
    ...formRegistryEntries,
    ...showcaseRegistryEntries,
  ] satisfies FilamentRegistry['entries']
  return entries.map((entry) => {
    const paddingTargets = validatedPaddingCatalog.targets.filter((target) => target.entryId === entry.id)
    return paddingTargets.length ? { ...entry, paddingTargets } : entry
  })
}
