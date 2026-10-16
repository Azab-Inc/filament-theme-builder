import type { IconPackName, ResourceIconKey } from '@/models/icons.model'
import type { PanelBrandingSetting, PanelBrandingSettings } from '@/models/panel-branding.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { createDefaultIconConfiguration, validateIconConfiguration } from '@/registry/icon-registry'
import { createDefaultPanelBrandingSettings, validatePanelBrandingSettings } from '@/utils/panel-branding-validation'
import { cloneTheme } from '@/utils/theme-store-helpers'

export function useThemeIconBrandingActions({ theme }: ThemeStoreContext) {
  function setIconPack(value: IconPackName): void {
    const candidate = cloneTheme(theme.value)
    candidate.icons = { ...candidate.icons, pack: value }
    if (validateIconConfiguration(candidate.icons).valid) theme.value = candidate
  }

  function setSemanticResourceIcon(key: ResourceIconKey, icon: string): void {
    const candidate = cloneTheme(theme.value)
    candidate.icons.overrides[key] = icon
    if (validateIconConfiguration(candidate.icons).valid) theme.value = candidate
  }

  function resetSemanticResourceIcon(key: ResourceIconKey): void {
    const candidate = cloneTheme(theme.value)
    delete candidate.icons.overrides[key]
    theme.value = candidate
  }

  function resetIconConfiguration(): void {
    theme.value = { ...cloneTheme(theme.value), icons: createDefaultIconConfiguration() }
  }

  function setBranding(settings: PanelBrandingSettings): void {
    const validation = validatePanelBrandingSettings(settings)
    if (validation.valid) theme.value = { ...cloneTheme(theme.value), branding: validation.settings }
  }

  function setBrandingSetting(setting: PanelBrandingSetting, value: PanelBrandingSettings[PanelBrandingSetting]): void {
    const candidate = cloneTheme(theme.value)
    const validation = validatePanelBrandingSettings({ ...candidate.branding, [setting]: value })
    if (validation.valid) theme.value = { ...candidate, branding: validation.settings }
  }

  function resetBranding(): void {
    theme.value = { ...cloneTheme(theme.value), branding: createDefaultPanelBrandingSettings() }
  }

  return { setIconPack, setSemanticResourceIcon, resetSemanticResourceIcon, resetIconConfiguration, setBranding, setBrandingSetting, resetBranding }
}
