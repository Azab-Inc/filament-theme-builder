import { describe, expect, it } from 'vitest'

import {
  createDefaultPanelBrandingSettings,
  classifyPanelBrandingSetting,
  validatePanelBrandingSettings,
} from '@/utils/panel-branding-validation'
import { exportPanelBrandingJson, exportPanelProviderBrandingPhp } from '@/utils/panel-branding-export'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

describe('panel branding settings', () => {
  it('migrates V3 state without branding and records undo/reset changes', () => {
    const legacy = createDefaultThemeState() as Record<string, unknown>
    delete legacy.branding
    localStorage.setItem('ftb-theme', JSON.stringify(legacy))
    setActivePinia(createPinia())
    const store = useThemeStore()
    expect(store.theme.branding.appName).toBe('Filament Theme Builder')
    store.setBrandingSetting('appName', 'Acme Admin')
    expect(store.theme.branding.appName).toBe('Acme Admin')
    store.undo()
    expect(store.theme.branding.appName).toBe('Filament Theme Builder')
    store.redo()
    store.resetBranding()
    expect(store.theme.branding.appName).toBe('Filament Theme Builder')
  })

  it('provides typed defaults for every supported setting', () => {
    expect(createDefaultPanelBrandingSettings()).toEqual({
      appName: 'Filament Theme Builder',
      lightLogo: null,
      darkLogo: null,
      favicon: null,
      logoHeight: '2.5rem',
      brandTypography: { kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' },
      contentWidth: '7xl',
      sidebar: 'collapsible',
    })
  })

  it('validates safe values and rejects executable or unsupported references', () => {
    const result = validatePanelBrandingSettings({
      ...createDefaultPanelBrandingSettings(),
      appName: '<script>alert(1)</script>',
      lightLogo: '../storage/app.php',
    })

    expect(result.valid).toBe(false)
  })

  it('classifies CSS, runtime, and export-only settings without pretending runtime is CSS', () => {
    expect(classifyPanelBrandingSetting('appName')).toBe('runtime-refresh')
    expect(classifyPanelBrandingSetting('lightLogo')).toBe('runtime-refresh')
    expect(classifyPanelBrandingSetting('brandTypography')).toBe('runtime-refresh')
    expect(classifyPanelBrandingSetting('contentWidth')).toBe('runtime-refresh')
    expect(classifyPanelBrandingSetting('sidebar')).toBe('runtime-refresh')
    expect(classifyPanelBrandingSetting('logoHeight')).toBe('css-previewable')
    expect(classifyPanelBrandingSetting('favicon')).toBe('export-only')
  })

  it('exports canonical JSON and native PanelProvider configuration', () => {
    const settings = { ...createDefaultPanelBrandingSettings(), appName: 'Acme Admin' }

    expect(JSON.parse(exportPanelBrandingJson(settings))).toEqual({ schemaVersion: 1, branding: settings })
    expect(exportPanelProviderBrandingPhp(settings)).toContain("->brandName('Acme Admin')")
    expect(exportPanelProviderBrandingPhp(settings)).toContain('->brandLogo(')
    expect(exportPanelProviderBrandingPhp(settings)).toContain('maxContentWidth')
  })
})
