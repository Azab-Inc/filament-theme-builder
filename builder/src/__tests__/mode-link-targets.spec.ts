import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { readModeLinkTarget, writeModeLinkTarget } from '@/utils/mode-link-targets'
import { createThemeRegistry } from '@/registry/theme-registry'
import { applyModeLinks } from '@/utils/apply-mode-links'
import { useThemeModeLinkActions } from '@/composables/use-theme-mode-link-actions'
import { ref } from 'vue'
import type { ThemeStateCurrent } from '@/models/theme.model'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'

const registry = createThemeRegistry()

describe('mode-link targets', () => {
  it('mirrors raw property edits from either mode and removes linked reset properties', () => {
    const state = createDefaultCurrentThemeState()
    const target = { kind: 'raw', selector: '.fi-btn', property: 'color' } as const
    writeModeLinkTarget(state, target, '#111111', 'light', registry)
    writeModeLinkTarget(state, target, '#111111', 'dark', registry)
    expect(readModeLinkTarget(state, target, 'dark', registry)).toBe('#111111')
  })

  it('updates semantic full-identity overrides without duplicating them', () => {
    const state = createDefaultCurrentThemeState()
    const target = { kind: 'semantic', targetId: 'button.primary', controlId: 'background', scope: 'global' } as const
    writeModeLinkTarget(state, target, '#111111', 'light', registry)
    writeModeLinkTarget(state, target, '#111111', 'dark', registry)
    expect(state.overrides.filter((item) => item.targetId === target.targetId && item.controlId === target.controlId)).toHaveLength(1)
    expect(readModeLinkTarget(state, target, 'dark', registry)).toBe('#111111')
  })

  it('rebuilds linked palette shades while leaving unrelated palette fields alone', () => {
    const state = createDefaultCurrentThemeState()
    const target = { kind: 'palette-base', name: 'success' } as const
    const beforePrimary = state.foundations.palettes.primary.base
    writeModeLinkTarget(state, target, '#123456', 'light', registry)
    writeModeLinkTarget(state, target, '#123456', 'dark', registry)
    expect(state.foundations.palettes.success.base).toBe('#123456')
    expect(state.foundations.palettes.primary.base).toBe(beforePrimary)
  })

  it('rejects malformed targets without modifying state', () => {
    const state = createDefaultCurrentThemeState()
    const before = structuredClone(state)
    expect(writeModeLinkTarget(state, { kind: 'raw', selector: 'body', property: 'color' } as never, '#123456', 'light', registry)).toBe(false)
    expect(readModeLinkTarget(state, { kind: 'raw', selector: '.fi-btn', property: 'color' }, 'light', registry)).toBe('')
    expect(state).toEqual(before)
  })

  it('mirrors explicitly changed raw linked values from the edited mode', () => {
    const before = createDefaultCurrentThemeState()
    before.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#111111' }, darkProperties: { color: '#111111' } }]
    const target = { kind: 'raw', selector: '.fi-btn', property: 'color' } as const
    const identity = `target:${JSON.stringify(target)}`
    before.modeLinks = { [identity]: { identity, target, value: '#111111', linked: true } }
    const candidate = structuredClone(before)
    candidate.rawOverrides[0]!.darkProperties!.color = '#222222'
    applyModeLinks(before, candidate)
    expect(candidate.rawOverrides[0]?.properties.color).toBe('#222222')
    expect(candidate.rawOverrides[0]?.darkProperties?.color).toBe('#222222')
    expect(candidate.modeLinks?.[modeLinkTargetIdentity(target)]?.value).toBe('#222222')
  })

  it('does not re-write linked targets after unrelated state changes', () => {
    const before = createDefaultCurrentThemeState()
    const target = { kind: 'palette-base', name: 'success' } as const
    const identity = `target:${JSON.stringify(target)}`
    before.modeLinks = { [identity]: { identity, target, value: before.foundations.palettes.success.base, linked: true } }
    const candidate = structuredClone(before)
    candidate.foundations.text.primary.light = '#222222'
    applyModeLinks(before, candidate)
    expect(candidate.foundations.palettes.success.base).toBe(before.foundations.palettes.success.base)
    expect(candidate.foundations.text.primary.dark).toBe(before.foundations.text.primary.dark)
  })

  it('resets both raw-mode entries and unlocks when a linked property is removed', () => {
    const before = createDefaultCurrentThemeState()
    const target = { kind: 'raw', selector: '.fi-btn', property: 'color' } as const
    const identity = `target:${JSON.stringify(target)}`
    before.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#111111', opacity: '0.5' }, darkProperties: { color: '#111111' } }]
    before.modeLinks = { [identity]: { identity, target, value: '#111111', linked: true } }
    const candidate = structuredClone(before)
    delete candidate.rawOverrides[0]!.properties.color
    applyModeLinks(before, candidate)
    expect(candidate.rawOverrides[0]).toEqual({ selector: '.fi-btn', properties: { opacity: '0.5' } })
    expect(candidate.modeLinks).toEqual({})
  })

  it('detects removal of an explicitly equal dark raw value despite unchanged effective appearance', () => {
    const before = createDefaultCurrentThemeState()
    const target = { kind: 'raw', selector: '.fi-btn', property: 'color' } as const
    const identity = `target:${JSON.stringify(target)}`
    before.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#111111' }, darkProperties: { color: '#111111' } }]
    before.modeLinks = { [identity]: { identity, target, value: '#111111', linked: true } }
    const candidate = structuredClone(before)
    delete candidate.rawOverrides[0]!.darkProperties!.color
    applyModeLinks(before, candidate)
    expect(candidate.rawOverrides[0]?.properties.color).toBeUndefined()
    expect(candidate.modeLinks).toEqual({})
  })

  it('exposes generic preflight, linking, and unlocking actions with independent values retained', () => {
    const theme = ref(createDefaultCurrentThemeState() as ThemeStateCurrent)
    const target = { kind: 'semantic', targetId: 'button.primary', controlId: 'background', scope: 'global' } as const
    theme.value.overrides.push({ targetId: target.targetId, controlId: target.controlId, scope: target.scope, value: '#111111', darkValue: '#222222' })
    const actions = useThemeModeLinkActions({ theme, registry })
    expect(actions.linkModeTarget(target, 'light')).toMatchObject({ ok: false, requiresConfirmation: true })
    expect(actions.linkModeTarget(target, 'light', 'replace')).toMatchObject({ ok: true, requiresConfirmation: false })
    expect(theme.value.overrides[0]).toMatchObject({ value: theme.value.overrides[0]?.darkValue })
    actions.bindingForModeTarget(target, 'light').toggle()
    expect(theme.value.modeLinks).toEqual({})
    expect(theme.value.overrides[0]?.value).toBe(theme.value.overrides[0]?.darkValue)
  })
})
