import { describe, expect, it } from 'vitest'

import { migrateThemeState } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { deserializeTheme, serializeCanonicalTheme } from '@/utils/theme-serialization'
import { globalOverride, registry } from './theme-serialization.fixtures'

describe('canonical V4 serialization', () => {
  it('round-trips raw overrides without mixing them into semantic overrides', () => {
    const state = createDefaultThemeState()
    state.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#0f766e' } }]
    const restored = deserializeTheme(serializeCanonicalTheme(state), registry)
    expect(restored).toMatchObject({ valid: true })
    if (restored.valid) {
      expect(restored.state.schemaVersion).toBe(5)
      expect('rawOverrides' in restored.state ? restored.state.rawOverrides : undefined).toEqual(state.rawOverrides)
      expect('overrides' in restored.state ? restored.state.overrides : undefined).toEqual([])
    }
  })

  it('migrates V1 through the canonical deserializer and preserves its primary color', () => {
    const restored = deserializeTheme({ schemaVersion: 1, colors: { primary: '#123456' } }, registry)
    expect(restored).toEqual({ valid: true, state: migrateThemeState({ schemaVersion: 1, colors: { primary: '#123456' } }) })
  })

  it('migrates V2 through the canonical deserializer and preserves semantic overrides', () => {
    const value = { schemaVersion: 2 as const, colors: { primary: '#123456' }, overrides: [globalOverride] }
    expect(deserializeTheme(value, registry)).toEqual({ valid: true, state: migrateThemeState(value) })
  })

  it('migrates V3 through the canonical deserializer without dropping icons or branding', () => {
    const state = createDefaultThemeState()
    const { rawOverrides: _rawOverrides, ...v3 } = { ...state, schemaVersion: 3 }
    const restored = deserializeTheme(v3, registry)
    expect(restored).toMatchObject({ valid: true })
    if (restored.valid) {
      expect(restored.state.schemaVersion).toBe(5)
      expect(restored.state).toMatchObject({ colors: v3.colors, overrides: v3.overrides })
      expect('icons' in restored.state ? restored.state.icons : undefined).toEqual(v3.icons)
      expect('branding' in restored.state ? restored.state.branding : undefined).toEqual(v3.branding)
    }
  })

  it('preserves V4 raw overrides, icons, and branding through the canonical deserializer', () => {
    const state = createDefaultThemeState()
    state.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#0f766e' } }]
    expect(deserializeTheme(state, registry)).toEqual({ valid: true, state: migrateThemeState(state) })
  })
})
