import { toRaw } from 'vue'

import type { ThemeMode, ResolvedFoundation } from '@/models/foundations.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { projectFoundations } from '@/utils/foundation-projection'
import { selectMode } from '@/utils/theme-store-helpers'

export function useThemeProjection({ theme }: ThemeStoreContext) {
  function resolveFoundation(mode: ThemeMode): ResolvedFoundation {
    const foundations = structuredClone(JSON.parse(JSON.stringify(toRaw(theme.value.foundations))))
    return { ...foundations, surfaces: selectMode(foundations.surfaces, mode, foundations, 'surfaces'), borders: selectMode(foundations.borders, mode, foundations, 'borders'), text: selectMode(foundations.text, mode, foundations, 'text') }
  }

  return { resolveFoundation, previewFoundation: (mode: ThemeMode) => projectFoundations(theme.value.foundations, mode) }
}
