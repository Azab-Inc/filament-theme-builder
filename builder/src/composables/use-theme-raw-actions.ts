import type { RawElementOverride, RawVisualProperty } from '@/models/raw-overrides.model'
import type { ThemeMode } from '@/models/foundations.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { validateRawElementOverride } from '@/utils/raw-override-validation'

export function useThemeRawActions({ theme, commit = (candidate) => { theme.value = candidate } }: ThemeStoreContext) {
  function setRawOverride(selector: string, property: RawVisualProperty, value: string, mode: ThemeMode = 'light'): void {
    const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
    const candidate: RawElementOverride = { selector, properties: { ...(existing?.properties ?? {}) }, darkProperties: { ...(existing?.darkProperties ?? {}) } }
    if (mode === 'dark') candidate.darkProperties![property] = value
    else candidate.properties[property] = value
    if (!Object.keys(candidate.darkProperties ?? {}).length) delete candidate.darkProperties
    if (!validateRawElementOverride(candidate).valid) return
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== selector)
    rawOverrides.push(candidate)
    commit({ ...cloneTheme(theme.value), rawOverrides })
  }

  function resetRawProperty(selector: string, property: RawVisualProperty, mode: ThemeMode = 'light'): void {
    const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
    if (!existing) return
    const properties = { ...existing.properties }
    const darkProperties = { ...(existing.darkProperties ?? {}) }
    const selected = mode === 'dark' ? darkProperties : properties
    if (!(property in selected)) return
    delete selected[property]
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== selector)
      .concat(Object.keys(properties).length > 0 || Object.keys(darkProperties).length > 0 ? [{ selector, properties, ...(Object.keys(darkProperties).length ? { darkProperties } : {}) }] : [])
    commit({ ...cloneTheme(theme.value), rawOverrides })
  }

  function resetRawOverride(selector: string, mode?: ThemeMode): void {
    const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
    if (!existing) return
    if (!mode) {
      commit({ ...cloneTheme(theme.value), rawOverrides: theme.value.rawOverrides.filter((override) => override.selector !== selector) })
      return
    }
    const properties = mode === 'light' ? {} : { ...existing.properties }
    const darkProperties = mode === 'dark' ? {} : { ...(existing.darkProperties ?? {}) }
    const next = Object.keys(properties).length || Object.keys(darkProperties).length
      ? [{ selector, properties, ...(Object.keys(darkProperties).length ? { darkProperties } : {}) }]
      : []
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== selector).concat(next)
    if (JSON.stringify(rawOverrides) !== JSON.stringify(theme.value.rawOverrides)) commit({ ...cloneTheme(theme.value), rawOverrides })
  }

  function renameRawOverride(fromSelector: string, toSelector: string): boolean {
    if (fromSelector === toSelector) return false
    const existing = theme.value.rawOverrides.find((override) => override.selector === fromSelector)
    if (!existing || theme.value.rawOverrides.some((override) => override.selector === toSelector)) return false
    const candidate = { selector: toSelector, properties: JSON.parse(JSON.stringify(existing.properties)) as typeof existing.properties, ...(existing.darkProperties ? { darkProperties: JSON.parse(JSON.stringify(existing.darkProperties)) as typeof existing.darkProperties } : {}) }
    if (!validateRawElementOverride(candidate).valid) return false
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== fromSelector)
    rawOverrides.push(candidate)
    commit({ ...cloneTheme(theme.value), rawOverrides })
    return true
  }

  return { setRawOverride, resetRawProperty, resetRawOverride, renameRawOverride }
}
