import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { applyThemeRelayIntent, parseThemeRelayIntent } from '@/utils/theme-relay-intent'
import { createThemeRegistry } from '@/registry/theme-registry'

describe('canonical relay token intents', () => {
  it('rejects malformed intent payloads before any store mutation', () => {
    expect(parseThemeRelayIntent(JSON.stringify({ schemaVersion: 1, kind: 'theme-intent', action: 'set' }))).toBeNull()
    expect(parseThemeRelayIntent(JSON.stringify({ schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'raw', selector: 'body', property: 'color' }, mode: 'light', value: '#123456' }))).toBeNull()
  })

  it('applies semantic and raw intents through the typed target domain', () => {
    const state = createDefaultCurrentThemeState()
    const semantic = { kind: 'semantic' as const, targetId: 'button.primary', controlId: 'background', scope: 'global' as const }
    const raw = { kind: 'raw' as const, selector: '.fi-btn', property: 'color' as const }
    const next = applyThemeRelayIntent(state, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: semantic, mode: 'light', value: '#123456' }, createThemeRegistry())
    const final = applyThemeRelayIntent(next, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: raw, mode: 'dark', value: '#abcdef' }, createThemeRegistry())
    expect(final.overrides.find((item) => item.targetId === 'button.primary')?.value).toBe('#123456')
    expect(final.rawOverrides[0]?.darkProperties?.color).toBe('#abcdef')
  })

  it('applies transparent through the same semantic, foundation, and raw relay validators', () => {
    const registry = createThemeRegistry(); const initial = createDefaultCurrentThemeState()
    const semantic = applyThemeRelayIntent(initial, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'semantic', targetId: 'form.product-name', controlId: 'background', scope: 'global' }, mode: 'light', value: 'transparent' }, registry)
    const foundation = applyThemeRelayIntent(semantic, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'foundation', path: 'surfaces.page' }, mode: 'dark', value: 'transparent' }, registry)
    const raw = applyThemeRelayIntent(foundation, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'raw', selector: '.fi-section', property: 'background-color' }, mode: 'light', value: 'transparent' }, registry)
    expect(raw.overrides.find((item) => item.targetId === 'form.product-name')?.value).toBe('transparent')
    expect(raw.foundations.surfaces.page.dark).toBe('transparent')
    expect(raw.rawOverrides[0]?.properties['background-color']).toBe('transparent')
  })

  it('uses the existing token and palette actions for CRUD and regeneration', () => {
    const registry = createThemeRegistry(); const initial = createDefaultCurrentThemeState()
    const created = applyThemeRelayIntent(initial, { schemaVersion: 1, kind: 'theme-intent', action: 'create-palette', target: { kind: 'user-palette', name: 'brand' }, value: '#123456' }, registry)
    expect(created.foundations.userTokens.palettes.brand?.shades[500]).toBeDefined()
    const updated = applyThemeRelayIntent(created, { schemaVersion: 1, kind: 'theme-intent', action: 'update', target: { kind: 'user-palette', name: 'brand' }, mode: 'dark', value: '#abcdef' }, registry)
    expect(updated.foundations.userTokens.palettes.brand?.base.dark).toBe('#abcdef')
    const originalSurface = updated.foundations.surfaces.page.light
    updated.foundations.surfaces.page.light = 'user.palette.brand.500'
    expect(() => applyThemeRelayIntent(updated, { schemaVersion: 1, kind: 'theme-intent', action: 'remove', target: { kind: 'user-palette', name: 'brand' } }, registry)).toThrow(/referenced/i)
    updated.foundations.surfaces.page.light = originalSurface
    expect(() => applyThemeRelayIntent(updated, { schemaVersion: 1, kind: 'theme-intent', action: 'remove', target: { kind: 'user-palette', name: 'brand' } }, registry)).not.toThrow()
  })

  it('links and unlinks built-in palette targets without losing the domain link record', () => {
    const registry = createThemeRegistry(); const initial = createDefaultCurrentThemeState()
    const linked = applyThemeRelayIntent(initial, { schemaVersion: 1, kind: 'theme-intent', action: 'link', target: { kind: 'palette-base', name: 'primary' }, mode: 'light' }, registry)
    expect(Object.values(linked.modeLinks)).toHaveLength(1)
    const unlinked = applyThemeRelayIntent(linked, { schemaVersion: 1, kind: 'theme-intent', action: 'unlink', target: { kind: 'palette-base', name: 'primary' } }, registry)
    expect(Object.values(unlinked.modeLinks)).toHaveLength(0)
  })

  it('sets foundation mode values and regenerates built-in palette shades through existing actions', () => {
    const registry = createThemeRegistry(); const initial = createDefaultCurrentThemeState()
    const foundation = applyThemeRelayIntent(initial, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'foundation', path: 'surfaces.page' }, mode: 'dark', value: '#111827' }, registry)
    expect(foundation.foundations.surfaces.page.dark).toBe('#111827')
    const palette = applyThemeRelayIntent(foundation, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'palette-base', name: 'primary' }, mode: 'light', value: '#0f766e' }, registry)
    expect(palette.foundations.palettes.primary.base).toBe('#0f766e')
    expect(palette.foundations.palettes.primary.shades[500]).toBeDefined()
  })

  it('supports user-color link and unlink while rejecting unsupported token resets and invalid values', () => {
    const registry = createThemeRegistry(); let state = createDefaultCurrentThemeState()
    state.foundations.userTokens.colors.accent = { light: '#123456' }
    const linked = applyThemeRelayIntent(state, { schemaVersion: 1, kind: 'theme-intent', action: 'link', target: { kind: 'user-color', name: 'accent' }, mode: 'light' }, registry)
    expect(Object.values(linked.modeLinks)).toHaveLength(1)
    const unlinked = applyThemeRelayIntent(linked, { schemaVersion: 1, kind: 'theme-intent', action: 'unlink', target: { kind: 'user-color', name: 'accent' } }, registry)
    expect(Object.values(unlinked.modeLinks)).toHaveLength(0)
    expect(parseThemeRelayIntent(JSON.stringify({ schemaVersion: 1, kind: 'theme-intent', action: 'reset', target: { kind: 'user-color', name: 'accent' } }), registry)).toBeNull()
    expect(() => applyThemeRelayIntent(state, { schemaVersion: 1, kind: 'theme-intent', action: 'set', target: { kind: 'palette-base', name: 'primary' }, value: 'not-a-color' }, registry)).toThrow()
  })

  it('rejects mismatched token creation targets without mutating the wrong token collection', () => {
    const registry = createThemeRegistry(); const state = createDefaultCurrentThemeState()
    expect(() => applyThemeRelayIntent(state, { schemaVersion: 1, kind: 'theme-intent', action: 'create-color', target: { kind: 'user-palette', name: 'brand' }, value: '#123456' }, registry)).toThrow(/invalid/i)
    expect(() => applyThemeRelayIntent(state, { schemaVersion: 1, kind: 'theme-intent', action: 'create-palette', target: { kind: 'user-color', name: 'brand' }, value: '#123456' }, registry)).toThrow(/invalid/i)
    expect(state.foundations.userTokens.colors.brand).toBeUndefined()
    expect(state.foundations.userTokens.palettes.brand).toBeUndefined()
  })

  it('rejects malformed palette shades instead of normalizing them to base updates', () => {
    const registry = createThemeRegistry(); const state = applyThemeRelayIntent(createDefaultCurrentThemeState(), { schemaVersion: 1, kind: 'theme-intent', action: 'create-palette', target: { kind: 'user-palette', name: 'brand' }, value: '#123456' }, registry)
    const payload = { schemaVersion: 1 as const, kind: 'theme-intent' as const, action: 'update' as const, target: { kind: 'user-palette' as const, name: 'brand', shade: 999 }, value: '#abcdef' }
    const malformedIntent = JSON.parse(JSON.stringify(payload))
    const palette = state.foundations.userTokens.palettes.brand
    if (!palette) throw new Error('expected palette fixture')
    expect(parseThemeRelayIntent(JSON.stringify(payload), registry)).toBeNull()
    expect(parseThemeRelayIntent(JSON.stringify({ ...payload, target: { kind: 'user-palette', name: 'brand', unexpected: true } }), registry)).toBeNull()
    expect(() => applyThemeRelayIntent(state, malformedIntent, registry)).toThrow(/invalid/i)
    expect(palette.base.light).toBe('#123456')
    expect(palette.shades[500]?.light).not.toBe('#abcdef')
  })
})
