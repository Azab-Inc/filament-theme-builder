import type { Ref } from 'vue'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV5 } from '@/models/theme.model'

export type ThemeStoreContext = {
  theme: Ref<ThemeStateV5>
  registry: FilamentRegistry
}
