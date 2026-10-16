import { toRaw } from 'vue'

import type { ThemeMode, ResolvedFoundation } from '@/models/foundations.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { projectFoundations } from '@/utils/foundation-projection'
import { selectMode } from '@/utils/theme-store-helpers'

export function useThemeProjection({ theme }: ThemeStoreContext) {
  function resolveFoundation(mode: ThemeMode): ResolvedFoundation {
    const foundations = structuredClone(JSON.parse(JSON.stringify(toRaw(theme.value.foundations))))
    return { ...foundations, surfaces: selectMode(foundations.surfaces, mode), borders: selectMode(foundations.borders, mode), text: selectMode(foundations.text, mode) }
  }

  return { resolveFoundation, previewFoundation: (mode: ThemeMode) => projectFoundations(theme.value.foundations, mode) }
}
