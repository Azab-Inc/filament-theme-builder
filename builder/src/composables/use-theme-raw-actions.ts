import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { cloneTheme } from '@/utils/theme-store-helpers'
import { validateRawElementOverride } from '@/utils/raw-override-validation'

export function useThemeRawActions({ theme }: ThemeStoreContext) {
  function setRawOverride(selector: string, property: RawVisualProperty, value: string): void {
    const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
    const candidate = { selector, properties: { ...(existing?.properties ?? {}), [property]: value } }
    if (!validateRawElementOverride(candidate).valid) return
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== selector)
    rawOverrides.push(candidate)
    theme.value = { ...cloneTheme(theme.value), rawOverrides }
  }

  function resetRawProperty(selector: string, property: RawVisualProperty): void {
    const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
    if (!existing || !(property in existing.properties)) return
    const properties = { ...existing.properties }
    delete properties[property]
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== selector)
      .concat(Object.keys(properties).length > 0 ? [{ selector, properties }] : [])
    theme.value = { ...cloneTheme(theme.value), rawOverrides }
  }

  function resetRawOverride(selector: string): void {
    if (theme.value.rawOverrides.some((override) => override.selector === selector)) {
      theme.value = { ...cloneTheme(theme.value), rawOverrides: theme.value.rawOverrides.filter((override) => override.selector !== selector) }
    }
  }

  function renameRawOverride(fromSelector: string, toSelector: string): boolean {
    if (fromSelector === toSelector) return false
    const existing = theme.value.rawOverrides.find((override) => override.selector === fromSelector)
    if (!existing || theme.value.rawOverrides.some((override) => override.selector === toSelector)) return false
    const candidate = { selector: toSelector, properties: JSON.parse(JSON.stringify(existing.properties)) as typeof existing.properties }
    if (!validateRawElementOverride(candidate).valid) return false
    const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== fromSelector)
    rawOverrides.push(candidate)
    theme.value = { ...cloneTheme(theme.value), rawOverrides }
    return true
  }

  return { setRawOverride, resetRawProperty, resetRawOverride, renameRawOverride }
}
