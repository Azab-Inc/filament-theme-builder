import { describe, expect, it, vi } from 'vitest'

import { useLocalThemePersistence } from '@/composables/use-local-theme-persistence'
import { createDefaultThemeState } from '@/utils/foundation-defaults'

describe('local theme persistence switching', () => {
  it('keeps the current active theme when persisting a switch fails', () => {
    vi.useFakeTimers(); localStorage.clear()
    const storage = new Proxy(localStorage, { get(target, key) {
      if (key === 'setItem') return (name: string, value: string) => {
        if (name === 'ftb-theme-active') throw new Error('active write denied')
        target.setItem(name, value)
      }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    } })
    let now = 500
    const persistence = useLocalThemePersistence({ storage, initialState: createDefaultThemeState(), now: () => now++, schedule: setTimeout, cancel: clearTimeout })
    persistence.initialize()
    const currentId = persistence.activeThemeId.value
    const other = persistence.createTheme()

    expect(persistence.switchTo(other.id)).toEqual({ ok: false, error: 'active write denied' })
    expect(persistence.activeThemeId.value).toBe(currentId)
  })
})
