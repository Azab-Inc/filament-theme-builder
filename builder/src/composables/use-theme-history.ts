import { computed, onScopeDispose, ref, watch, type Ref } from 'vue'

import type { ThemeStateV4 } from '@/models/theme.model'
import type { LocalThemeHistory } from '@/models/local-theme.model'
import { cloneTheme, sameTheme, snapshot } from '@/utils/theme-store-helpers'

export function useThemeHistory(theme: Ref<ThemeStateV4>, serialize: (value: ThemeStateV4) => unknown, storageKey: string, initial?: LocalThemeHistory, save?: (state: ThemeStateV4, history: LocalThemeHistory) => void) {
  const history = (initial?.snapshots ?? [snapshot(theme.value)]).map(snapshot)
  const historyIndex = ref(initial?.cursor ?? 0)
  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < history.length - 1)
  let applyingHistory = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  watch(theme, (value) => {
    if (!applyingHistory && !sameTheme(history[historyIndex.value]!, value)) {
      history.splice(historyIndex.value + 1)
      history.push(snapshot(value))
      historyIndex.value = history.length - 1
    }
    save?.(value, { snapshots: history.map(snapshot), cursor: historyIndex.value })
    if (save) return
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(storageKey, JSON.stringify(serialize(value))) } catch { /* unavailable storage */ }
      saveTimer = undefined
    }, 300)
  }, { deep: true, flush: 'sync' })

  function applyTheme(value: ThemeStateV4): void {
    applyingHistory = true
    theme.value = cloneTheme(value)
    applyingHistory = false
  }

  function replaceHistory(value: LocalThemeHistory): void {
    history.splice(0, history.length, ...value.snapshots.map(snapshot))
    historyIndex.value = value.cursor
  }

  onScopeDispose(() => { if (saveTimer) clearTimeout(saveTimer) })

  return {
    canUndo,
    canRedo,
    applyTheme,
    replaceHistory,
    undo: (): void => { if (canUndo.value) { historyIndex.value -= 1; applyTheme(history[historyIndex.value]!) } },
    redo: (): void => { if (canRedo.value) { historyIndex.value += 1; applyTheme(history[historyIndex.value]!) } },
  }
}
