import { computed, onScopeDispose, ref, toRaw, watch } from 'vue'
import { defineStore } from 'pinia'

import type { ThemeState } from '@/models/theme.model'

const storageKey = 'ftb-theme'
const defaultTheme: ThemeState = { schemaVersion: 1, colors: { primary: '#6366f1' } }

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeState>(restoreTheme())
  const history = [structuredClone(toRaw(theme.value))]
  const historyIndex = ref(0)
  let applyingHistory = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  watch(theme, (value) => {
    if (!applyingHistory && !sameTheme(history[historyIndex.value]!, value)) {
      history.splice(historyIndex.value + 1)
      history.push(structuredClone(toRaw(value)))
      historyIndex.value = history.length - 1
    }
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(value))
      } catch {
        // Storage may be unavailable or full; editing remains usable.
      }
      saveTimer = undefined
    }, 300)
  }, { deep: true, flush: 'sync' })

  onScopeDispose(() => {
    if (saveTimer) clearTimeout(saveTimer)
  })

  function applyTheme(value: ThemeState): void {
    applyingHistory = true
    theme.value = structuredClone(value)
    applyingHistory = false
  }

  return {
    theme,
    canUndo: computed(() => historyIndex.value > 0),
    canRedo: computed(() => historyIndex.value < history.length - 1),
    setPrimaryColor(color: string): void {
      if (!/^#[\da-f]{6}$/i.test(color) || color === theme.value.colors.primary) return
      theme.value = { ...theme.value, colors: { ...theme.value.colors, primary: color.toLowerCase() } }
    },
    undo(): void {
      if (historyIndex.value > 0) {
        historyIndex.value -= 1
        applyTheme(history[historyIndex.value]!)
      }
    },
    redo(): void {
      if (historyIndex.value < history.length - 1) {
        historyIndex.value += 1
        applyTheme(history[historyIndex.value]!)
      }
    },
  }
})

function restoreTheme(): ThemeState {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    if (value) {
      const parsed: unknown = JSON.parse(value)
      if (isThemeState(parsed)) return structuredClone(parsed)
    }
  } catch {
    // Invalid or unavailable persisted data falls back to a safe default.
  }
  return structuredClone(defaultTheme)
}

function isThemeState(value: unknown): value is ThemeState {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<ThemeState>
  return candidate.schemaVersion === 1 && typeof candidate.colors?.primary === 'string'
    && /^#[\da-f]{6}$/i.test(candidate.colors.primary)
}

function sameTheme(left: ThemeState, right: ThemeState): boolean {
  return left.schemaVersion === right.schemaVersion && left.colors.primary === right.colors.primary
}
