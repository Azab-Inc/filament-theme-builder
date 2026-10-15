import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
export { SUPPORTED_FILAMENT_COMPATIBILITY } from '@/registry/theme-registry-catalog-constants'
import { coreRegistryEntries } from '@/registry/theme-registry-catalog-core'
import { formRegistryEntries } from '@/registry/theme-registry-catalog-forms'
import { showcaseRegistryEntries } from '@/registry/theme-registry-catalog-showcases'

export function createRegistryCatalog(): readonly RegistryEntry[] {
  return [
    ...coreRegistryEntries,
    ...formRegistryEntries,
    ...showcaseRegistryEntries,
  ] satisfies FilamentRegistry['entries']
}
