import { toRaw } from 'vue'

import type { ThemeMode, ResolvedFoundation, FoundationState } from '@/models/foundations.model'
import type { UserTokens } from '@/models/user-tokens.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { projectFoundations } from '@/utils/foundation-projection'
import { selectMode } from '@/utils/theme-store-helpers'
import { resolveUserColorValue } from '@/utils/user-token-resolution'

export function useThemeProjection({ theme }: ThemeStoreContext) {
  function resolveFoundation(mode: ThemeMode): ResolvedFoundation {
    const foundations = resolvedState(mode)
    resolveTokenValues(foundations, foundations.userTokens, mode)
    return { ...foundations, surfaces: selectMode(foundations.surfaces, mode, foundations, 'surfaces'), borders: selectMode(foundations.borders, mode, foundations, 'borders'), text: selectMode(foundations.text, mode, foundations, 'text') }
  }

  return { resolveFoundation, previewFoundation: (mode: ThemeMode) => projectFoundations(resolvedState(mode), mode) }

  function resolvedState(mode: ThemeMode): FoundationState {
    const foundations = structuredClone(JSON.parse(JSON.stringify(toRaw(theme.value.foundations)))) as FoundationState
    resolveTokenValues(foundations, foundations.userTokens, mode)
    return foundations
  }
}

function resolveTokenValues(value: unknown, tokens: UserTokens | undefined, mode: ThemeMode): void {
  if (!value || typeof value !== 'object') return
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (typeof child === 'string' && child.startsWith('user.')) (value as Record<string, unknown>)[key] = resolveUserColorValue(tokens, child, mode) ?? child
    else resolveTokenValues(child, tokens, mode)
  }
}
