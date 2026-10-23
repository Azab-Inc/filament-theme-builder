import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useThemeStore } from '@/stores/theme'
import { createDefaultThemeState } from '@/utils/foundation-defaults'

describe('padding store actions', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('keeps linked four-edge edits as one undoable assignment', () => {
    const store = useThemeStore()
    store.setPadding({ operation: 'set', context: { scope: 'component', targetId: 'forms.input' }, edges: { top: '1px', right: '2px', bottom: '3px', left: '4px' } })
    expect(store.theme.padding).toHaveLength(1)
    store.undo()
    expect(store.theme.padding).toEqual([])
    store.redo()
    expect(store.theme.padding[0]?.edges).toEqual({ top: '1px', right: '2px', bottom: '3px', left: '4px' })
  })

  it('preserves separate records and resets only selected edges regardless of key order', () => {
    const store = useThemeStore()
    store.setPadding({ operation: 'set', context: { scope: 'section', sectionId: 'forms' }, edges: { top: '1px', right: '2px' } })
    store.setPadding({ operation: 'set', context: { targetId: 'forms.input', scope: 'component' }, edges: { top: 0, left: '4px' } })
    store.resetPadding({ operation: 'reset', context: { targetId: 'forms.input', scope: 'component' }, resetEdges: ['top'] })
    expect(store.theme.padding).toEqual([
      { scope: 'section', sectionId: 'forms', edges: { top: '1px', right: '2px' } },
      { targetId: 'forms.input', scope: 'component', edges: { left: '4px' } },
    ])
  })

  it('does not create a history entry or reorder records for a no-op set', () => {
    const store = useThemeStore()
    const mutation = { operation: 'set' as const, context: { scope: 'component' as const, targetId: 'forms.input' }, edges: { top: 0 as const } }
    store.setPadding(mutation)
    const before = JSON.parse(JSON.stringify(store.theme.padding))
    store.setPadding(mutation)
    expect(store.theme.padding).toEqual(before)
    store.undo()
    expect(store.theme.padding).toEqual([])
  })

  it('persists and restores V5 padding while migrating every V4 history entry', () => {
    const store = useThemeStore()
    store.setPadding({ operation: 'set', context: { scope: 'component', targetId: 'forms.input' }, edges: { top: 0 } })
    store.saveTheme()
    const id = store.activeThemeId
    const state = JSON.parse(localStorage.getItem(`ftb-theme:${id}`)!)
    expect(state.schemaVersion).toBe(5)
    expect(state.padding[0].edges.top).toBe(0)
    expect(JSON.parse(localStorage.getItem(`ftb-theme-history:${id}`)!).snapshots[0].schemaVersion).toBe(5)
  })

  it('migrates all V4 history snapshots without dropping the cursor', () => {
    const v4 = createDefaultThemeState()
    const second = { ...v4, colors: { primary: '#0f766e' }, foundations: { ...v4.foundations, palettes: { ...v4.foundations.palettes, primary: { ...v4.foundations.palettes.primary, base: '#0f766e' } } } }
    localStorage.setItem('ftb-themes', JSON.stringify([{ id: 'legacy', name: 'Legacy', updatedAt: 1 }]))
    localStorage.setItem('ftb-theme-active', 'legacy')
    localStorage.setItem('ftb-theme:legacy', JSON.stringify(v4))
    localStorage.setItem('ftb-theme-history:legacy', JSON.stringify({ snapshots: [v4, second], cursor: 1 }))
    const store = useThemeStore()
    expect(store.theme.schemaVersion).toBe(5)
    expect(store.theme.colors.primary).toBe('#6366f1')
    const history = JSON.parse(localStorage.getItem('ftb-theme-history:legacy')!)
    expect(history.snapshots).toHaveLength(2)
    expect(history.snapshots.every((snapshot: { schemaVersion: number }) => snapshot.schemaVersion === 5)).toBe(true)
    expect(history.snapshots[1].colors.primary).toBe('#0f766e')
    expect(history.cursor).toBe(1)
  })
})
