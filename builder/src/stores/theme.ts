import { computed, onScopeDispose, ref, toRaw, watch } from 'vue'
import { defineStore } from 'pinia'

import { migrateThemeState } from '@/models/theme.model'
import type { ResolveRequest, ResolveResult, ThemeOverride, ThemeState, ThemeStateV2 } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveThemeValue } from '@/services/theme-resolver'
import { deserializeTheme } from '@/services/theme-serialization'
import { validateThemeOverride } from '@/services/theme-validation'

const storageKey = 'ftb-theme'
const registry = createThemeRegistry()
const defaultTheme: ThemeStateV2 = { schemaVersion: 2, colors: { primary: '#6366f1' }, overrides: [] }

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeStateV2>(restoreTheme())
  const history = [snapshot(theme.value)]
  const historyIndex = ref(0)
  let applyingHistory = false
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  watch(theme, (value) => {
    if (!applyingHistory && !sameTheme(history[historyIndex.value]!, value)) {
      history.splice(historyIndex.value + 1)
      history.push(snapshot(value))
      historyIndex.value = history.length - 1
    }
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(toRaw(value)))
      } catch {
        // Storage may be unavailable or full; editing remains usable.
      }
      saveTimer = undefined
    }, 300)
  }, { deep: true, flush: 'sync' })

  onScopeDispose(() => {
    if (saveTimer) clearTimeout(saveTimer)
  })

  function applyTheme(value: ThemeStateV2): void {
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
    setOverride(override: ThemeOverride): void {
      const candidate = structuredClone(override)
      if (!validateThemeOverride(candidate, registry).valid) return

      const overrides = theme.value.overrides.filter((existing) => !sameOverrideKey(existing, candidate))
      overrides.push(candidate)
      theme.value = { ...theme.value, overrides }
    },
    resetOverride(request: ResolveRequest): void {
      const scope = deepestScope(request)
      const overrides = theme.value.overrides.filter((override) => !matchesRequest(override, request, scope))
      if (overrides.length === theme.value.overrides.length) return
      theme.value = { ...theme.value, overrides }
    },
    resolve(request: ResolveRequest): ResolveResult {
      return resolveThemeValue(theme.value, registry, request)
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

function restoreTheme(): ThemeStateV2 {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    if (value) {
      const restored = deserializeTheme(value, registry)
      if (restored.valid) return migrateToCurrent(restored.state)
    }
  } catch {
    // Invalid or unavailable persisted data falls back to a safe default.
  }
  return structuredClone(defaultTheme)
}

function migrateToCurrent(state: ThemeState): ThemeStateV2 {
  return migrateThemeState(state)
}

function deepestScope(request: ResolveRequest): ThemeOverride['scope'] {
  if (request.stateId !== undefined) return 'state'
  if (request.variantId !== undefined) return 'variant'
  if (request.componentId !== undefined) return 'component'
  return 'global'
}

function sameOverrideKey(left: ThemeOverride, right: ThemeOverride): boolean {
  return left.targetId === right.targetId
    && left.controlId === right.controlId
    && left.scope === right.scope
    && left.componentId === right.componentId
    && left.variantId === right.variantId
    && left.stateId === right.stateId
}

function matchesRequest(override: ThemeOverride, request: ResolveRequest, scope: ThemeOverride['scope']): boolean {
  return override.targetId === request.targetId
    && override.controlId === request.controlId
    && override.scope === scope
    && override.componentId === request.componentId
    && override.variantId === request.variantId
    && override.stateId === request.stateId
}

function sameTheme(left: ThemeStateV2, right: ThemeStateV2): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function snapshot(value: ThemeStateV2): ThemeStateV2 {
  return structuredClone(JSON.parse(JSON.stringify(toRaw(value))) as ThemeStateV2)
}
