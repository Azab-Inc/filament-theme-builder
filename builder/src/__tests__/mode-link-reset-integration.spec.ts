import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('resetting linked inherited overrides', () => {
  it('resets both semantic modes and restores the link on undo', () => {
    const store = useThemeStore()
    const target = { kind: 'semantic' as const, targetId: 'form.product-name', controlId: 'background', scope: 'global' as const }
    store.setOverride({ targetId: target.targetId, controlId: target.controlId, scope: target.scope, value: '#123456' })
    store.linkModeTarget(target, 'light', 'replace')
    const identity = store.bindingForModeTarget(target, 'light').identity
    store.resetOverride({ targetId: target.targetId, controlId: target.controlId, mode: 'dark' })
    expect(store.theme.overrides).toEqual([])
    expect(store.isModeLinked(identity)).toBe(false)
    store.undo()
    expect(store.isModeLinked(identity)).toBe(true)
  })

  it('resets both palette shade overrides without deleting sibling shades', () => {
    const store = useThemeStore()
    store.setPaletteShadeOverride('primary', 400, '#555555')
    store.setPaletteShadeOverride('primary', 500, '#123456')
    const target = { kind: 'palette-shade' as const, name: 'primary' as const, shade: 500 as const }
    store.linkModeTarget(target, 'light', 'replace')
    store.resetPaletteShade('primary', 500, 'dark')
    expect(store.theme.foundations.palettes.primary.overrides[500]).toBeUndefined()
    expect(store.theme.foundations.palettes.primary.dark?.overrides?.[500]).toBeUndefined()
    expect(store.theme.foundations.palettes.primary.overrides[400]).toBe('#555555')
    expect(store.isModeLinked(store.bindingForModeTarget(target, 'light').identity)).toBe(false)
  })

  it.each(['light', 'dark'] as const)('resets a linked palette base from %s to native defaults and removes its link', (mode) => {
    const store = useThemeStore()
    const original = store.theme.foundations.palettes.primary.base
    store.setPrimaryColor('#123456')
    const target = { kind: 'palette-base' as const, name: 'primary' as const }
    store.linkModeTarget(target, 'light', 'replace')
    store.resetFoundation(mode === 'dark' ? 'palettes.primary.dark.base' : 'palettes.primary.base')
    expect(store.theme.foundations.palettes.primary.base).toBe(original)
    expect(store.theme.foundations.palettes.primary.dark?.base).toBeUndefined()
    expect(store.isModeLinked(store.bindingForModeTarget(target, 'light').identity)).toBe(false)
  })
})
