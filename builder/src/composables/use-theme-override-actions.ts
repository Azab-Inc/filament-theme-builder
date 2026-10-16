import type { ThemeOverride, ResolveRequest } from '@/models/theme.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { sameOverrideKey, deepestScope, matchesRequest, cloneTheme, toLegacyTheme } from '@/utils/theme-store-helpers'
import { resolveThemeValue } from '@/utils/theme-resolver'
import { validateThemeOverride } from '@/utils/theme-validation'

export function useThemeOverrideActions({ theme, registry }: ThemeStoreContext) {
  function setOverride(override: ThemeOverride): void {
    const candidate = structuredClone(override)
    if (!validateThemeOverride(candidate, registry).valid) return
    const overrides = theme.value.overrides.filter((existing) => !sameOverrideKey(existing, candidate))
    overrides.push(candidate)
    theme.value = { ...theme.value, overrides }
  }

  function resetOverride(request: ResolveRequest): void {
    const scope = deepestScope(request)
    const overrides = theme.value.overrides.filter((override) => !matchesRequest(override, request, scope))
    if (overrides.length !== theme.value.overrides.length) theme.value = { ...theme.value, overrides }
  }

  return {
    setOverride,
    resetOverride,
    resolve: (request: ResolveRequest) => resolveThemeValue(toLegacyTheme(theme.value), registry, request),
  }
}
