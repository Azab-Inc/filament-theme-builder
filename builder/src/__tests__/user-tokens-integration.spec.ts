import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { serializeCanonicalTheme, deserializeTheme } from '@/utils/theme-serialization'
import { createThemeRegistry } from '@/registry/theme-registry'
import { validateFoundationState } from '@/utils/foundation-validation'
import { exportVanillaCss } from '@/utils/vanilla-css-export'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('named tokens and explicit mode links through canonical store boundaries', () => {
  it('keeps live references, blocks dangling deletion, and exports safe CSS variables', () => {
    const store = useThemeStore()
    expect(store.createUserColor('accent', '#123456').ok).toBe(true)
    store.setFoundation('surfaces.page.light', 'user.color.accent')
    store.setRawOverride('.fi-section', 'color', 'user.color.accent')
    store.setOverride({ targetId: 'form.product-name', controlId: 'background', scope: 'global', value: 'user.color.accent' })
    expect(store.removeUserToken('accent').ok).toBe(false)
    store.updateUserToken('accent', '#654321', 'light')
    expect(store.previewFoundation('light').mappings.find((entry) => entry.id === 'surface.page')?.value).toBe('#654321')
    const exported = exportVanillaCss(serializeCanonicalTheme(store.theme))
    expect(exported.errors).toEqual([])
    expect(exported.css).toContain('--ftb-user-color-accent: #654321')
    expect(exported.css).toContain('background-color: var(--ftb-user-color-accent)')
    expect(exported.css).toContain('color: var(--ftb-user-color-accent)')
  })

  it('supports palette generation and independent mode edits without cross-name deletion matches', () => {
    const store = useThemeStore()
    store.createUserPalette('secondary', '#123456')
    store.updateUserToken('secondary', '#abcdef', 'dark')
    expect(Object.keys(store.theme.foundations.userTokens.palettes.secondary!.shades)).toHaveLength(11)
    expect(store.theme.foundations.userTokens.palettes.secondary!.shades[500]).toEqual({ light: '#123456', dark: '#abcdef' })
    store.createUserColor('accent', '#123456'); store.createUserColor('accent-more', '#234567')
    store.setFoundation('text.primary.light', 'user.color.accent-more')
    expect(store.removeUserToken('accent').ok).toBe(true)
  })

  it('links a raw state using the active mode, survives JSON roundtrip, and unlinks atomically', () => {
    const store = useThemeStore()
    const target = { kind: 'raw' as const, selector: '.fi-sidebar-item-btn:hover .fi-sidebar-item-label', property: 'color' as const }
    store.setRawOverride(target.selector, target.property, '#123456', 'light')
    store.setRawOverride(target.selector, target.property, '#abcdef', 'dark')
    const before = JSON.stringify(store.theme)
    expect(store.linkModeTarget(target, 'dark').requiresConfirmation).toBe(true)
    expect(JSON.stringify(store.theme)).toBe(before)
    store.linkModeTarget(target, 'dark', 'replace')
    store.setRawOverride(target.selector, target.property, '#334455', 'light')
    expect(store.theme.rawOverrides[0]?.darkProperties?.color).toBe('#334455')
    const restored = deserializeTheme(JSON.stringify(serializeCanonicalTheme(store.theme)), createThemeRegistry())
    expect(restored.valid).toBe(true)
    const identity = store.bindingForModeTarget(target, 'dark').identity
    store.unlinkMode(identity)
    store.setRawOverride(target.selector, target.property, '#ffffff', 'dark')
    expect(store.theme.rawOverrides[0]?.properties.color).toBe('#334455')
    store.undo(); store.undo()
    expect(store.isModeLinked(identity)).toBe(true)
  })

  it('rejects malformed token definitions, unknown references, and forged link descriptors', () => {
    const state = serializeCanonicalTheme(useThemeStore().theme)
    state.foundations.userTokens.colors.bad = { light: '#1234567' }
    expect(validateFoundationState(state).valid).toBe(false)
    delete state.foundations.userTokens.colors.bad
    state.rawOverrides = [{ selector: '.fi-section', properties: { color: 'user.color.missing' } }]
    expect(validateFoundationState(state).valid).toBe(false)
    state.rawOverrides = []
    Object.assign(state.modeLinks, { arbitrary: { identity: 'arbitrary', value: '#123456', linked: true, target: { kind: 'raw', selector: 'body', property: 'color' } } })
    expect(validateFoundationState(state).valid).toBe(false)
  })

  it('rejects mode links to missing palettes and nonexistent foundation fields', () => {
    const state = serializeCanonicalTheme(useThemeStore().theme)
    for (const target of [{ kind: 'user-palette-base' as const, name: 'missing' }, { kind: 'foundation' as const, path: 'surfaces.missing' }]) {
      const identity = modeLinkTargetIdentity(target)
      state.modeLinks = { [identity]: { identity, value: '#123456', linked: true, target } }
      expect(validateFoundationState(state).valid).toBe(false)
    }
  })

  it('rejects imported links with missing or divergent explicit mode values', () => {
    const state = serializeCanonicalTheme(useThemeStore().theme)
    const target = { kind: 'raw' as const, selector: '.fi-section', property: 'color' as const }
    const identity = modeLinkTargetIdentity(target)
    state.rawOverrides = [{ selector: target.selector, properties: { color: '#123456' } }]
    state.modeLinks = { [identity]: { identity, value: '#123456', linked: true, target } }
    expect(validateFoundationState(state).valid).toBe(false)
    state.rawOverrides[0]!.darkProperties = { color: '#abcdef' }
    expect(validateFoundationState(state).valid).toBe(false)
    state.rawOverrides[0]!.darkProperties.color = '#123456'
    expect(validateFoundationState(state).valid).toBe(true)
  })
})
