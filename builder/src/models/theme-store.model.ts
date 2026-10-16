import type { Ref } from 'vue'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV4 } from '@/models/theme.model'

export type ThemeStoreContext = {
  theme: Ref<ThemeStateV4>
  registry: FilamentRegistry
}
