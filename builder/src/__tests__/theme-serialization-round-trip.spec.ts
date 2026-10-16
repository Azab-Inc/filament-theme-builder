import { describe, expect, it } from 'vitest'

import { migrateThemeState } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { deserializeTheme, serializeCanonicalTheme, serializeTheme } from '@/utils/theme-serialization'
import { primaryScope, registry, themeWithGlobalAndVariant } from './theme-serialization.fixtures'

describe('theme serialization round trips and invalid requests', () => {
  it('round-trips the current domain representation without copying inherited values', () => {
    const serialized = serializeTheme(themeWithGlobalAndVariant, registry, primaryScope, 'minimal')
    if (!serialized.valid) throw new Error(serialized.error)
    expect(deserializeTheme(JSON.stringify(serialized.state), registry))
      .toEqual({ valid: true, state: migrateThemeState(serialized.state) })
  })

  it('rejects malformed runtime input before state validation', () => {
    expect(deserializeTheme('{"schemaVersion":2,"colors":null,"overrides":[]}', registry))
      .toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
    expect(deserializeTheme('[]', registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
    expect(deserializeTheme('{not-json', registry)).toMatchObject({ valid: false, error: expect.stringMatching(/invalid/i) })
  })

  it('exports the canonical foundation state including generated palette shades', () => {
    const theme = createDefaultThemeState()
    theme.foundations.palettes.primary.base = '#0f766e'
    theme.foundations.palettes.primary.shades[500] = '#123456'
    theme.foundations.explicitPaths.push('palettes.primary.base')
    const exported = serializeCanonicalTheme(theme)
    expect(exported.schemaVersion).toBe(4)
    expect(exported.foundations.palettes.primary.base).toBe('#0f766e')
    expect(exported.foundations.palettes.primary.shades[500]).toBe('#123456')
    expect(exported.foundations.explicitPaths).toEqual(['palettes.primary.base'])
    expect(exported.foundations.spacing['0.5']).toBeDefined()
    expect(exported).not.toBe(theme)
  })

  it('rejects an invalid serialization scope request before traversal', () => {
    expect(serializeTheme(themeWithGlobalAndVariant, registry, null as never, 'fully-explicit')).toMatchObject({
      valid: false, error: expect.stringMatching(/invalid.*request/i),
    })
    expect(serializeTheme(themeWithGlobalAndVariant, registry, {
      targetId: 'button.primary', controlId: 'background', variantId: 'primary',
    } as never, 'fully-explicit')).toMatchObject({ valid: false, error: expect.stringMatching(/invalid.*request/i) })
  })
})
