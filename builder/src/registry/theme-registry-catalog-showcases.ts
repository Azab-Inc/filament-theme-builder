import type { RegistryEntry } from '@/models/theme-registry.model'
import { componentShowcaseEntries } from '@/registry/theme-registry-catalog-showcases-components'
import { navigationShowcaseEntries } from '@/registry/theme-registry-catalog-showcases-navigation'

export const showcaseRegistryEntries: readonly RegistryEntry[] = [
  ...componentShowcaseEntries,
  ...navigationShowcaseEntries,
]
