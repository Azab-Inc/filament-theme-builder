import { computed, onScopeDispose, readonly, ref, toRaw, watch } from 'vue'
import { defineStore } from 'pinia'

import type { Density, PaletteName, PaletteShade, ResolvedFoundation, ThemeMode } from '@/models/foundations.model'
import { PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState, createDefaultThemeState } from '@/services/foundation-defaults'
import { projectFoundations } from '@/services/foundation-projection'
import { validateFoundationState } from '@/services/foundation-validation'
import { applyPaletteOverrides, generatePalette } from '@/services/palette-generator'
import { migrateThemeState } from '@/models/theme.model'
import type { ResolveRequest, ResolveResult, ThemeOverride, ThemeState, ThemeStateV2, ThemeStateV3 } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveThemeValue } from '@/services/theme-resolver'
import { deserializeTheme } from '@/services/theme-serialization'
import { validateThemeOverride } from '@/services/theme-validation'

const storageKey = 'ftb-theme'
const registry = createThemeRegistry()
const defaultTheme = createDefaultThemeState()

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeStateV3>(restoreTheme())
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
        localStorage.setItem(storageKey, JSON.stringify(serializeTheme(value)))
      } catch {
        // Storage may be unavailable or full; editing remains usable.
      }
      saveTimer = undefined
    }, 300)
  }, { deep: true, flush: 'sync' })

  onScopeDispose(() => {
    if (saveTimer) clearTimeout(saveTimer)
  })

  function applyTheme(value: ThemeStateV3): void {
    applyingHistory = true
    theme.value = structuredClone(value)
    applyingHistory = false
  }

  return {
    theme: readonly(theme),
    canUndo: computed(() => historyIndex.value > 0),
    canRedo: computed(() => historyIndex.value < history.length - 1),
    setPrimaryColor(color: string): void {
      if (!/^#[\da-f]{6}$/i.test(color) || color === theme.value.colors.primary) return
      const candidate = cloneTheme(theme.value)
      candidate.colors.primary = color.toLowerCase()
      const palette = candidate.foundations.palettes.primary
      palette.base = candidate.colors.primary
      markExplicit(candidate, 'palettes.primary.base')
      rebuildPalette(candidate.foundations.palettes.primary)
      theme.value = candidate
    },
    setOverride(override: ThemeOverride): void {
      const candidate = structuredClone(override)
      if (!validateThemeOverride(candidate, registry).valid) return

      const overrides = theme.value.overrides.filter((existing) => !sameOverrideKey(existing, candidate))
      overrides.push(candidate)
      theme.value = { ...theme.value, overrides }
    },
    setFoundation(path: string, value: unknown): void {
      if (isDerivedShadePath(path)) return
      const candidate = cloneTheme(theme.value)
      if (!setPath(candidate.foundations as unknown as Record<string, unknown>, path, value)) return
      if (!validateFoundationState(candidate.foundations).valid) return
      markExplicit(candidate, path)
      syncPalette(candidate, path)
      theme.value = candidate
    },
    resetFoundation(path: string): void {
      if (isDerivedShadePath(path)) return
      const defaults = createDefaultFoundationState()
      const value = getPath(defaults as unknown as Record<string, unknown>, path)
      if (value === undefined) return
      const candidate = cloneTheme(theme.value)
      if (!setPath(candidate.foundations as unknown as Record<string, unknown>, path, value)) return
      if (!validateFoundationState(candidate.foundations).valid) return
      candidate.foundations.explicitPaths = candidate.foundations.explicitPaths.filter((entry) => entry !== path)
      syncPalette(candidate, path)
      theme.value = candidate
    },
    setPaletteBase(name: PaletteName, value: string): void {
      if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
      const candidate = cloneTheme(theme.value)
      const palette = candidate.foundations.palettes[name]
      palette.base = value.toLowerCase()
      markExplicit(candidate, `palettes.${name}.base`)
      rebuildPalette(palette)
      if (name === 'primary') candidate.colors.primary = palette.base
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    setPaletteShadeOverride(name: PaletteName, shade: PaletteShade, value: string): void {
      if (!PALETTE_SHADES.includes(shade) || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
      const candidate = cloneTheme(theme.value)
      const palette = candidate.foundations.palettes[name]
      palette.overrides[shade] = value.toLowerCase()
      rebuildPalette(palette)
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    resetPaletteShade(name: PaletteName, shade: PaletteShade): void {
      if (!PALETTE_SHADES.includes(shade)) return
      const candidate = cloneTheme(theme.value)
      const palette = candidate.foundations.palettes[name]
      delete palette.overrides[shade]
      rebuildPalette(palette)
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    setDensity(value: Density): void {
      if (value !== 'compact' && value !== 'default' && value !== 'spacious') return
      const candidate = cloneTheme(theme.value)
      candidate.foundations.density = value
      markExplicit(candidate, 'density')
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    resolveFoundation(mode: ThemeMode): ResolvedFoundation {
      const foundations = structuredClone(JSON.parse(JSON.stringify(toRaw(theme.value.foundations))))
      return {
        ...foundations,
        surfaces: selectMode(foundations.surfaces, mode),
        borders: selectMode(foundations.borders, mode),
        text: selectMode(foundations.text, mode),
      }
    },
    previewFoundation(mode: ThemeMode) {
      return projectFoundations(theme.value.foundations, mode)
    },
    resetOverride(request: ResolveRequest): void {
      const scope = deepestScope(request)
      const overrides = theme.value.overrides.filter((override) => !matchesRequest(override, request, scope))
      if (overrides.length === theme.value.overrides.length) return
      theme.value = { ...theme.value, overrides }
    },
    resolve(request: ResolveRequest): ResolveResult {
      return resolveThemeValue(toLegacyTheme(theme.value), registry, request)
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

function restoreTheme(): ThemeStateV3 {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    if (value) {
      const parsed: unknown = JSON.parse(value)
      if (isVersionThree(parsed)) {
        const normalized = normalizeTheme(parsed)
        const validation = validateFoundationState(normalized)
        if (validation.valid) return normalized
      } else {
        const restored = deserializeTheme(parsed, registry)
        if (restored.valid) return migrateToCurrent(restored.state)
      }
    }
  } catch {
    // Invalid or unavailable persisted data falls back to a safe default.
  }
  return structuredClone(defaultTheme)
}

function migrateToCurrent(state: ThemeState): ThemeStateV3 {
  const legacy = migrateThemeState(state)
  const current = createDefaultThemeState()
  current.colors.primary = legacy.colors.primary
  current.foundations.palettes.primary.base = legacy.colors.primary
  current.overrides = structuredClone(legacy.overrides)
  normalizePalettes(current)
  return current
}

function normalizeTheme(value: ThemeStateV3): ThemeStateV3 {
  const normalized = cloneTheme(value)
  normalized.foundations.explicitPaths ??= []
  normalizePalettes(normalized)
  return normalized
}

function normalizePalettes(value: ThemeStateV3): void {
  value.colors.primary = value.foundations.palettes.primary.base
  for (const palette of Object.values(value.foundations.palettes)) rebuildPalette(palette)
}

function serializeTheme(value: ThemeStateV3): unknown {
  const serialized = cloneTheme(value)
  for (const palette of Object.values(serialized.foundations.palettes)) {
    delete (palette as unknown as { shades?: Record<number, string> }).shades
  }
  return serialized
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

function sameTheme(left: ThemeStateV3, right: ThemeStateV3): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function snapshot(value: ThemeStateV3): ThemeStateV3 {
  return structuredClone(JSON.parse(JSON.stringify(toRaw(value))) as ThemeStateV3)
}

function cloneTheme(value: ThemeStateV3): ThemeStateV3 {
  return structuredClone(JSON.parse(JSON.stringify(toRaw(value))) as ThemeStateV3)
}

function rebuildPalette(palette: ThemeStateV3['foundations']['palettes'][PaletteName]): void {
  palette.shades = applyPaletteOverrides(generatePalette(palette.base), palette.overrides)
}

function syncPalette(theme: ThemeStateV3, path: string): void {
  const match = /^palettes\.(primary|success|warning|danger|info|gray)\.(base|overrides)(?:\.|$)/.exec(path)
  if (!match) return
  const name = match[1] as PaletteName
  const palette = theme.foundations.palettes[name]
  rebuildPalette(palette)
  if (name === 'primary') theme.colors.primary = palette.base
}

function isDerivedShadePath(path: string): boolean {
  return /^palettes\.(primary|success|warning|danger|info|gray)\.shades(?:\.|$)/.test(path)
}

function toLegacyTheme(value: ThemeStateV3): ThemeStateV2 {
  return {
    schemaVersion: 2,
    colors: { primary: value.colors.primary },
    overrides: structuredClone(JSON.parse(JSON.stringify(toRaw(value.overrides)))),
  }
}

function getPath(root: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, root)
}

function setPath(root: Record<string, unknown>, path: string, value: unknown): boolean {
  const keys = path.split('.')
  const leaf = keys.pop()
  if (!leaf) return false
  if (keys.length === 0) {
    root[leaf] = value
    return true
  }
  let target: Record<string, unknown> = root
  for (const key of keys) {
    if (!isRecord(target[key])) return false
    target = target[key]
  }
  target[leaf] = value
  return true
}

function markExplicit(theme: ThemeStateV3, path: string): void {
  if (!theme.foundations.explicitPaths.includes(path)) theme.foundations.explicitPaths.push(path)
}

function selectMode<T>(values: Record<string, { light: T; dark: T }>, mode: ThemeMode): Record<string, T> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value[mode]]))
}

function isVersionThree(value: unknown): value is ThemeStateV3 {
  return isRecord(value) && value.schemaVersion === 3
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
