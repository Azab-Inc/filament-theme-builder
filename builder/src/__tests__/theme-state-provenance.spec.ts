import { describe, expect, it } from 'vitest'

import { createPinia, setActivePinia } from 'pinia'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import {
  createThemeState,
  primaryButtonVariantOverride,
  resetThemeStateTest,
  readActiveThemeState,
} from './theme-state-test-helpers'

describe('theme state provenance and recovery', () => {
  resetThemeStateTest()

  it('does not project unversioned legacy foundation values as user edits', () => {
    const state = createDefaultThemeState()
    state.foundations.borderWidth = 4
    delete (state.foundations as unknown as { explicitPaths?: string[] }).explicitPaths
    delete (state.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    localStorage.setItem('ftb-theme', JSON.stringify(state))

    const store = createThemeState()

    expect(store.theme.foundations.borderWidth).toBe(1)
    expect(store.theme.foundations.explicitPaths).toEqual([])
    expect(store.previewFoundation('light').mappings).toEqual([])
    const persisted = readActiveThemeState() as { foundations: { provenanceVersion: number; borderWidth: number } }
    expect(persisted.foundations.provenanceVersion).toBe(1)
    expect(persisted.foundations.borderWidth).toBe(1)
  })

  it('archives unversioned V3 values before native normalization without overwriting an archive', () => {
    const state = createDefaultThemeState()
    state.colors.primary = '#123456'
    state.foundations.palettes.primary.base = '#123456'
    state.foundations.borders.default.light = '#654321'
    state.overrides = [primaryButtonVariantOverride]
    delete (state.foundations as unknown as { explicitPaths?: string[] }).explicitPaths
    delete (state.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    const original = JSON.stringify(state, null, 2)
    localStorage.setItem('ftb-theme', original)

    const store = createThemeState()

    expect(store.theme.foundations.palettes.primary.base).toBe('#6366f1')
    expect(localStorage.getItem('ftb-theme-legacy-recovery')).toBe(original)

    const replacement = JSON.stringify({ schemaVersion: 3, preserved: true })
    localStorage.setItem('ftb-theme', replacement)
    setActivePinia(createPinia())
    createThemeState()
    expect(localStorage.getItem('ftb-theme-legacy-recovery')).toBe(original)
  })

  it('restores an archived legacy foundation through validated explicit provenance', () => {
    const state = createDefaultThemeState()
    state.colors.primary = '#123456'
    state.foundations.palettes.primary.base = '#123456'
    state.foundations.borders.default.light = '#654321'
    state.overrides = [primaryButtonVariantOverride]
    delete (state.foundations as unknown as { explicitPaths?: string[] }).explicitPaths
    delete (state.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    localStorage.setItem('ftb-theme', JSON.stringify(state))

    const store = createThemeState()
    expect(store.legacyRecoveryAvailable).toBe(true)

    expect(store.restoreLegacyRecovery()).toBe(true)
    expect(store.theme.colors.primary).toBe('#123456')
    expect(store.theme.foundations.borders.default.light).toBe('#654321')
    expect(store.theme.foundations.explicitPaths).toEqual(expect.arrayContaining([
      'palettes.primary.base',
      'borders.default.light',
    ]))
    expect(store.theme.overrides).toEqual([primaryButtonVariantOverride])
    expect(store.legacyRecoveryAvailable).toBe(false)
  })

  it('rejects provenance metadata paths through the generic foundation setter', () => {
    const store = createThemeState()
    const before = JSON.stringify(store.theme)

    store.setFoundation('explicitPaths', ['density'])
    store.setFoundation('provenanceVersion', 99)

    expect(JSON.stringify(store.theme)).toBe(before)
  })
})
