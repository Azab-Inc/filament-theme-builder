import { describe, expect, it } from 'vitest'

import { createDefaultThemeState } from '@/utils/foundation-defaults'
import {
  ICON_PACK_PRESETS,
  RESOURCE_ICON_KEYS,
  resolveResourceIcon,
  validateIconConfiguration,
} from '@/registry/icon-registry'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'

describe('icon configuration', () => {
  it('provides the default and alternative Heroicons presets', () => {
    const theme = createDefaultThemeState()

    expect(Object.keys(ICON_PACK_PRESETS)).toEqual(['default', 'solid', 'mini'])
    expect(theme.icons).toEqual({ pack: 'default', overrides: {} })
    expect(RESOURCE_ICON_KEYS).toContain('products')
  })

  it('lets an individual semantic override beat the selected pack', () => {
    const configuration = { pack: 'solid' as const, overrides: { products: 'heroicon-o-cube' } }

    expect(resolveResourceIcon(configuration, 'products')).toBe('heroicon-o-cube')
    expect(resolveResourceIcon(configuration, 'orders')).toBe('heroicon-s-shopping-cart')
  })

  it('rejects unknown packs, semantic keys, and icon identifiers', () => {
    expect(validateIconConfiguration({ pack: 'unknown', overrides: {} })).toMatchObject({ valid: false })
    expect(validateIconConfiguration({ pack: 'default', overrides: { unknown: 'heroicon-o-cube' } })).toMatchObject({ valid: false })
    expect(validateIconConfiguration({ pack: 'default', overrides: { products: 'not-an-icon' } })).toMatchObject({ valid: false })
    expect(validateIconConfiguration({ pack: 'default', overrides: { products: 'heroicon-o-nonsense' } })).toMatchObject({ valid: false })
  })

  it('includes icon state in canonical JSON export', () => {
    const theme = createDefaultThemeState()
    theme.icons.pack = 'mini'
    theme.icons.overrides.products = 'heroicon-m-cube'

    expect(serializeCanonicalTheme(theme).icons).toEqual(theme.icons)
  })
})
