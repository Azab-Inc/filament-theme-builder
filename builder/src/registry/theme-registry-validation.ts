import type { FilamentRegistry, RegistryEntry } from '@/models/theme-registry.model'
import { freezeEntry } from '@/registry/theme-registry-validation-freeze'
import { validateEntry } from '@/registry/theme-registry-validation-entry'

const compatibilityPattern = /^(\d+)\.x$/

export function validateRegistry(entries: readonly RegistryEntry[]): FilamentRegistry {
  if (!Array.isArray(entries) || entries.length === 0) {
    throw new Error('Registry must contain entries')
  }
  const ids = new Set<string>()
  const validatedEntries = entries
    .map((entry) => {
      validateEntry(entry, ids, compatibilityPattern)
      ids.add(entry.id)
      return freezeEntry(entry)
    })
    .sort((left, right) => left.id.localeCompare(right.id))
  if (
    new Set(validatedEntries.map(({ filamentCompatibility }) => filamentCompatibility)).size !== 1
  ) {
    throw new Error('Compatibility metadata must be consistent across registry entries')
  }
  return Object.freeze({ entries: Object.freeze(validatedEntries) })
}
