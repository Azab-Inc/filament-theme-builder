import { effectScope, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'

import { useLocalThemePersistence } from '@/composables/use-local-theme-persistence'
import { useThemeHistory } from '@/composables/use-theme-history'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { themeHistoryKey } from '@/utils/local-theme-storage'
import { cloneTheme } from '@/utils/theme-store-helpers'

describe('local theme history persistence', () => {
  it('persists a new edit from an earlier cursor and removes the redo branch', () => {
    vi.useFakeTimers(); localStorage.clear()
    let now = 200
    const persistence = useLocalThemePersistence({ storage: localStorage, initialState: createDefaultThemeState(), now: () => now++, schedule: setTimeout, cancel: clearTimeout })
    persistence.initialize()
    const id = persistence.activeThemeId.value
    const theme = ref(persistence.activeState.value)
    const scope = effectScope()
    const history = scope.run(() => useThemeHistory(theme, (state) => state, '', persistence.activeHistory.value, (state, saved) => persistence.scheduleSave(id, state, saved)))!

    const firstEdit = cloneTheme(theme.value)
    firstEdit.colors.primary = '#111111'; firstEdit.foundations.palettes.primary.base = '#111111'
    theme.value = firstEdit
    const secondEdit = cloneTheme(theme.value)
    secondEdit.colors.primary = '#222222'; secondEdit.foundations.palettes.primary.base = '#222222'
    theme.value = secondEdit
    vi.advanceTimersByTime(300)
    history.undo()
    const branchEdit = cloneTheme(theme.value)
    branchEdit.colors.primary = '#333333'; branchEdit.foundations.palettes.primary.base = '#333333'
    theme.value = branchEdit
    vi.advanceTimersByTime(300)
    scope.stop()

    const saved = JSON.parse(localStorage.getItem(themeHistoryKey(id))!) as { snapshots: { colors: { primary: string } }[]; cursor: number }
    expect(saved.cursor).toBe(2)
    expect(saved.snapshots.map((snapshot) => snapshot.colors.primary)).toEqual(['#6366f1', '#111111', '#333333'])
  })
})
