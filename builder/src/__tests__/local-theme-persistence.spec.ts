import { describe, expect, it, vi } from 'vitest'

import { useLocalThemePersistence } from '@/composables/use-local-theme-persistence'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { themeHistoryKey, themeStateKey } from '@/utils/local-theme-storage'
import { cloneTheme } from '@/utils/theme-store-helpers'
import type { LocalThemeHistory } from '@/models/local-theme.model'

const makePersistence = (storage: Storage = window.localStorage) => {
  let now = 100
  const persistence = useLocalThemePersistence({ storage, initialState: createDefaultThemeState(), now: () => now++, schedule: setTimeout, cancel: clearTimeout })
  persistence.initialize()
  return persistence
}

const edit = (persistence: ReturnType<typeof makePersistence>, id: string, color: string) => {
  const state = cloneTheme(persistence.activeState.value)
  state.colors.primary = color
  state.foundations.palettes.primary.base = color
  const history: LocalThemeHistory = { snapshots: [cloneTheme(persistence.activeState.value), state], cursor: 1 }
  persistence.scheduleSave(id, state, history)
  return { state, history }
}

describe('local theme persistence', () => {
  it('saves exactly once at 300ms with independent state and history keys', () => {
    vi.useFakeTimers(); localStorage.clear()
    const persistence = makePersistence(); const { state, history } = edit(persistence, persistence.activeThemeId.value, '#0f766e')
    vi.advanceTimersByTime(299); expect(localStorage.getItem(themeStateKey(persistence.activeThemeId.value))).not.toContain('#0f766e')
    vi.advanceTimersByTime(1)
    expect(JSON.parse(localStorage.getItem(themeStateKey(persistence.activeThemeId.value))!).colors.primary).toBe(state.colors.primary)
    expect(JSON.parse(localStorage.getItem(themeHistoryKey(persistence.activeThemeId.value))!).cursor).toBe(history.cursor)
  })

  it('keeps state and history independent for different theme IDs', () => {
    vi.useFakeTimers(); localStorage.clear()
    const persistence = makePersistence()
    const firstId = persistence.activeThemeId.value
    const first = edit(persistence, firstId, '#0f766e')
    const secondTheme = persistence.createTheme()
    persistence.switchTo(secondTheme.id)
    const second = edit(persistence, secondTheme.id, '#dc2626')
    vi.advanceTimersByTime(300)

    expect(JSON.parse(localStorage.getItem(themeStateKey(firstId))!).colors.primary).toBe(first.state.colors.primary)
    expect(JSON.parse(localStorage.getItem(themeHistoryKey(firstId))!).snapshots).toHaveLength(first.history.snapshots.length)
    expect(JSON.parse(localStorage.getItem(themeStateKey(secondTheme.id))!).colors.primary).toBe(second.state.colors.primary)
    expect(JSON.parse(localStorage.getItem(themeHistoryKey(secondTheme.id))!).snapshots).toHaveLength(second.history.snapshots.length)
  })

  it('flushes before switching and never lets a stale callback cross IDs', () => {
    vi.useFakeTimers(); localStorage.clear(); const persistence = makePersistence(); const oldId = persistence.activeThemeId.value
    const created = persistence.createTheme(); const old = edit(persistence, oldId, '#0f766e')
    expect(persistence.switchTo(created.id)).toEqual({ ok: true }); expect(JSON.parse(localStorage.getItem(themeStateKey(oldId))!).colors.primary).toBe(old.state.colors.primary)
    edit(persistence, created.id, '#dc2626'); vi.advanceTimersByTime(299); persistence.switchTo(oldId); vi.advanceTimersByTime(1)
    expect(JSON.parse(localStorage.getItem(themeStateKey(created.id))!).colors.primary).toBe('#dc2626')
    expect(persistence.activeThemeId.value).toBe(oldId)
  })

  it('flushes and cancels pending work when deleting a theme', () => {
    vi.useFakeTimers(); localStorage.clear(); const persistence = makePersistence(); const id = persistence.createTheme().id
    const { state } = edit(persistence, id, '#0f766e'); expect(persistence.deleteTheme(id)).toEqual({ ok: true })
    vi.advanceTimersByTime(300); expect(localStorage.getItem(themeStateKey(id))).toBeNull(); expect(state.colors.primary).toBe('#0f766e')
  })

  it('exposes storage failures while keeping edits usable', () => {
    vi.useFakeTimers(); const base = window.localStorage; base.clear(); let denied = false
    const storage = new Proxy(base, { get(target, key) { if (key === 'setItem' && denied) return () => { throw new Error('quota') }; const value = Reflect.get(target, key, target); return typeof value === 'function' ? value.bind(target) : value } })
    const persistence = makePersistence(storage); denied = true; const { state } = edit(persistence, persistence.activeThemeId.value, '#0f766e')
    vi.advanceTimersByTime(300); expect(persistence.storageError.value).toContain('quota'); expect(persistence.activeState.value.colors.primary).not.toBe(state.colors.primary)
    persistence.activeState.value.colors.primary = '#dc2626'; expect(persistence.activeState.value.colors.primary).toBe('#dc2626')
  })
})
