import { describe, expect, it } from 'vitest'

import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { exportIconConfigurationPhp } from '@/utils/icon-export'

describe('icon PHP export', () => {
  it('exports explicit PanelProvider icon mappings without CSS', () => {
    const theme = createDefaultThemeState()
    theme.icons.pack = 'solid'
    theme.icons.overrides.products = 'heroicon-o-cube'

    expect(exportIconConfigurationPhp(theme.icons)).toContain("'panels::resources.products.navigation-item' => 'heroicon-o-cube'")
    expect(exportIconConfigurationPhp(theme.icons)).toContain("'panels::resources.orders.navigation-item' => 'heroicon-s-shopping-cart'")
    expect(exportIconConfigurationPhp(theme.icons)).toContain("->icons([")
  })
})
