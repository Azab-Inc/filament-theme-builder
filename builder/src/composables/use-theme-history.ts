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
  let lastPaddingEditSignature: string | null = null
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  function paddingEditSignature(previous: ThemeStateV5, next: ThemeStateV5): string | null {
    if (JSON.stringify({ ...previous, padding: [] }) !== JSON.stringify({ ...next, padding: [] })) return null
    const before = new Map(previous.padding.map(({ edges, ...context }) => [JSON.stringify(context), edges]))
    const after = new Map(next.padding.map(({ edges, ...context }) => [JSON.stringify(context), edges]))
    const changes = [...new Set([...before.keys(), ...after.keys()])].flatMap((context) => {
      const previousEdges = before.get(context) ?? {}
      const nextEdges = after.get(context) ?? {}
      const edges = [...new Set([...Object.keys(previousEdges), ...Object.keys(nextEdges)])].filter((edge) => previousEdges[edge as keyof typeof previousEdges] !== nextEdges[edge as keyof typeof nextEdges])
      return edges.length ? [`${context}:${edges.sort().join(',')}`] : []
    })
    return changes.length ? changes.sort().join('|') : null
  }

  function isPaddingValueReplacement(previous: ThemeStateV5, next: ThemeStateV5): boolean {
    if (JSON.stringify({ ...previous, padding: [] }) !== JSON.stringify({ ...next, padding: [] })) return false
    const shape = (value: ThemeStateV5) => value.padding.map(({ edges, ...context }) => ({ context, edges: Object.keys(edges).sort() }))
    return JSON.stringify(shape(previous)) === JSON.stringify(shape(next))
  }

  watch(theme, (value) => {
    if (!applyingHistory && !sameTheme(history[historyIndex.value]!, value)) {
      const now = Date.now()
      const previous = history[historyIndex.value]!
      const signature = paddingEditSignature(previous, value)
      const groupPaddingChange = lastPaddingEditSignature === signature && signature !== null && now - lastChangeAt < 500 && isPaddingValueReplacement(previous, value)
      history.splice(historyIndex.value + 1)
      if (groupPaddingChange) history[historyIndex.value] = snapshot(value)
      else history.push(snapshot(value))
      historyIndex.value = history.length - 1
      lastChangeAt = now
      lastPaddingEditSignature = signature
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
    lastPaddingEditSignature = null
  }

  onScopeDispose(() => { if (saveTimer) clearTimeout(saveTimer) })

  return {
    canUndo,
    canRedo,
    applyTheme,
    replaceHistory,
    undo: (): void => { if (canUndo.value) { historyIndex.value -= 1; lastPaddingEditSignature = null; applyTheme(history[historyIndex.value]!) } },
    redo: (): void => { if (canRedo.value) { historyIndex.value += 1; lastPaddingEditSignature = null; applyTheme(history[historyIndex.value]!) } },
  }
}
