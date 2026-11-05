import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('token name normalization at the creation boundary', () => {
  it.each(['color', 'palette'] as const)('creates a %s from a trimmed capitalized name', (kind) => {
    const store = useThemeStore()
    const result = kind === 'color' ? store.createUserColor('  Secondary  ', '#64748b') : store.createUserPalette('  Secondary  ', '#64748b')
    expect(result.ok).toBe(true)
    const tokens = serializeCanonicalTheme(store.theme).foundations.userTokens
    expect(Object.keys(kind === 'color' ? tokens.colors : tokens.palettes)).toEqual(['secondary'])
    const before = JSON.stringify(store.theme)
    expect(store.createUserColor('SECONDARY', '#123456')).toMatchObject({ ok: false, error: 'That token name already exists.' })
    expect(JSON.stringify(store.theme)).toBe(before)
  })

  it('still rejects reserved names and invalid internal characters without writing', () => {
    const store = useThemeStore()
    const before = JSON.stringify(store.theme)
    expect(store.createUserPalette(' PRIMARY ', '#64748b')).toMatchObject({ ok: false, error: expect.stringMatching(/reserved/i) })
    expect(store.createUserColor('Brand Accent', '#64748b').ok).toBe(false)
    expect(store.createUserColor('   ', '#64748b').ok).toBe(false)
    expect(store.createUserColor('Accent;', '#64748b').ok).toBe(false)
    expect(JSON.stringify(store.theme)).toBe(before)
  })
})
