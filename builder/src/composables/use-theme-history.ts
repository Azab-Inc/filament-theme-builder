import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

import type { ThemeStateV5 } from '@/models/theme.model'
import type { LocalThemeHistory } from '@/models/local-theme.model'
import { cloneTheme, sameTheme, snapshot } from '@/utils/theme-store-helpers'

export function useThemeHistory(theme: Ref<ThemeStateV5>, serialize: (value: ThemeStateV5) => unknown, storageKey: string, initial?: LocalThemeHistory, save?: (state: ThemeStateV5, history: LocalThemeHistory) => void) {
  const history = (initial?.snapshots ?? [snapshot(theme.value)]).map(snapshot)
  const historyIndex = ref(initial?.cursor ?? 0)
  const historyRevision = ref(0)
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => { historyRevision.value; return historyIndex.value < history.length - 1 })
  let applyingHistory = false
  let lastChangeAt = 0
  let lastChangeWasPaddingOnly = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  function isPaddingOnlyChange(previous: ThemeStateV5, next: ThemeStateV5): boolean {
    return JSON.stringify({ ...previous, padding: [] }) === JSON.stringify({ ...next, padding: [] })
  }

  function isPaddingValueReplacement(previous: ThemeStateV5, next: ThemeStateV5): boolean {
    if (!isPaddingOnlyChange(previous, next)) return false
    const shape = (value: ThemeStateV5) => value.padding.map(({ edges, ...context }) => ({ context, edges: Object.keys(edges).sort() }))
    return JSON.stringify(shape(previous)) === JSON.stringify(shape(next))
  }

  watch(theme, (value) => {
    if (!applyingHistory && !sameTheme(history[historyIndex.value]!, value)) {
      const now = Date.now()
      const groupPaddingChange = lastChangeWasPaddingOnly && now - lastChangeAt < 500 && isPaddingValueReplacement(history[historyIndex.value]!, value)
      history.splice(historyIndex.value + 1)
      if (groupPaddingChange) history[historyIndex.value] = snapshot(value)
      else history.push(snapshot(value))
      historyIndex.value = history.length - 1
      lastChangeAt = now
      lastChangeWasPaddingOnly = isPaddingOnlyChange(history[historyIndex.value - 1] ?? history[historyIndex.value]!, value)
    }
    save?.(value, { snapshots: history.map(snapshot), cursor: historyIndex.value })
    if (save) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(serialize(value))) } catch { /* unavailable storage */ }
      saveTimer = undefined
    }, 300)
  }, { deep: true, flush: 'sync' })

  function applyTheme(value: ThemeStateV5): void {
    applyingHistory = true
    theme.value = cloneTheme(value)
    applyingHistory = false
  }

  function replaceHistory(value: LocalThemeHistory): void {
    history.splice(0, history.length, ...value.snapshots.map(snapshot))
    historyIndex.value = value.cursor
    historyRevision.value += 1
    lastChangeWasPaddingOnly = false
  }

  onScopeDispose(() => { if (saveTimer) clearTimeout(saveTimer) })

  return {
    canUndo,
    canRedo,
    applyTheme,
    replaceHistory,
    undo: (): void => { if (canUndo.value) { historyIndex.value -= 1; lastChangeWasPaddingOnly = false; applyTheme(history[historyIndex.value]!) } },
    redo: (): void => { if (canRedo.value) { historyIndex.value += 1; lastChangeWasPaddingOnly = false; applyTheme(history[historyIndex.value]!) } },
  }
}
