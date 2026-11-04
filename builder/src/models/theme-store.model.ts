import type { Ref } from 'vue'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateCurrent } from '@/models/theme.model'

export type ThemeStoreContext = {
  theme: Ref<ThemeStateCurrent>
  registry: FilamentRegistry
  commit?: (candidate: ThemeStateCurrent) => void
}
