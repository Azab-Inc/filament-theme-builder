import { describe, expect, it } from 'vitest'
import { applyLinkedValue, linkModes, unlockModes } from '@/utils/theme-mode-links'
import { applyModeLinks } from '@/utils/apply-mode-links'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'

describe('explicit per-value mode links', () => {
  it('requires confirmation before replacing a differing opposite mode and cancels without writes', () => {
    const values = { light: '#fff', dark: '#000' } as const
    expect(linkModes('text.primary', { mode: 'light', value: '#fff' }, values, 'cancel')).toBeNull()
    expect(linkModes('text.primary', { mode: 'light', value: '#fff' }, values, 'keep')?.requiresConfirmation).toBe(true)
    expect(linkModes('text.primary', { mode: 'light', value: '#fff' }, values, 'replace')?.values).toEqual({ light: '#fff', dark: '#fff' })
  })

  it('mirrors either active mode while linked and preserves appearance when unlocked', () => {
    const link = linkModes('semantic.button', { mode: 'dark', value: '#111' }, { light: '#fff', dark: '#111' }, 'replace')!
    const changed = applyLinkedValue(link.link, link.values, 'light', '#222')
    expect(changed).toEqual({ light: '#222', dark: '#222' })
    expect(unlockModes(link.link, changed)).toEqual({ values: changed, link: undefined })
    expect(applyLinkedValue(undefined, changed, 'dark', '#333')).toEqual({ light: '#222', dark: '#333' })
  })

  it('guards canonical foundation writes and mirrors a linked value atomically', () => {
    const previous = createDefaultCurrentThemeState()
    previous.foundations.text.primary = { light: '#111111', dark: '#eeeeee' }
    previous.modeLinks = { 'foundation.text.primary': { identity: 'foundation.text.primary', value: '#111111', linked: true } }
    const candidate = structuredClone(previous)
    candidate.foundations.text.primary.light = '#222222'
    const applied = applyModeLinks(previous, candidate)
    expect(applied.foundations.text.primary).toEqual({ light: '#222222', dark: '#222222' })
    expect(applied.modeLinks?.['foundation.text.primary']?.value).toBe('#222222')
  })
})
