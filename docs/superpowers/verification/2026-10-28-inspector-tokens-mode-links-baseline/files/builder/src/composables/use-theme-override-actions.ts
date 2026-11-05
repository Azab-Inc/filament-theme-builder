import type { ThemeOverride, ResolveRequest } from '@/models/theme.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { sameOverrideKey, deepestScope, matchesRequest, cloneTheme, toLegacyTheme } from '@/utils/theme-store-helpers'
import { resolveThemeValue } from '@/utils/theme-resolver'
import { validateThemeOverride } from '@/utils/theme-validation'

export function useThemeOverrideActions({ theme, registry }: ThemeStoreContext) {
  function setOverride(override: ThemeOverride): void {
    const candidate = structuredClone(override)
    if (!validateThemeOverride(candidate, registry).valid) return
    const existing = theme.value.overrides.find((item) => sameOverrideKey(item, candidate))
    const overrides = theme.value.overrides.filter((item) => !sameOverrideKey(item, candidate))
    if (candidate.mode === 'dark') {
      const merged = { ...(existing ?? {}), ...candidate, darkValue: candidate.value }
      if (existing?.value !== undefined) merged.value = existing.value
      else delete merged.value
      delete merged.mode
      overrides.push(merged)
    } else overrides.push(existing?.darkValue === undefined ? { ...candidate, mode: undefined } : { ...candidate, darkValue: existing.darkValue, mode: undefined })
    theme.value = { ...theme.value, overrides }
  }

  function resetOverride(request: ResolveRequest): void {
    const scope = deepestScope(request)
    const mode = request.mode ?? 'light'
    const overrides = theme.value.overrides.flatMap((override) => {
      if (!matchesRequest(override, request, scope)) return [override]
      if (mode === 'dark' && override.darkValue !== undefined) {
        const next = { ...override }
        delete next.darkValue
        return next.value === undefined ? [] : [next]
      }
      if (mode === 'light' && override.value !== undefined) {
        const next = { ...override }
        delete next.value
        return next.darkValue === undefined ? [] : [next]
      }
      return [override]
    })
    if (JSON.stringify(overrides) !== JSON.stringify(theme.value.overrides)) theme.value = { ...theme.value, overrides }
  }

  return {
    setOverride,
    resetOverride,
    resolve: (request: ResolveRequest) => resolveThemeValue(toLegacyTheme(theme.value), registry, request),
  }
}
