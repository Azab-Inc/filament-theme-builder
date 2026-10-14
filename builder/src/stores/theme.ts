import { computed, onScopeDispose, readonly, ref, toRaw, watch } from 'vue'
import { defineStore } from 'pinia'

import type { Density, PaletteName, PaletteShade, ResolvedFoundation, ThemeMode } from '@/models/foundations.model'
import { PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState, createDefaultThemeState } from '@/services/foundation-defaults'
import { projectFoundations } from '@/services/foundation-projection'
import { isEditableFoundationPath, validateFoundationState } from '@/services/foundation-validation'
import { archiveLegacyTheme, clearLegacyRecovery, legacyRecoveryError, readLegacyRecovery, restoreLegacyTheme } from '@/services/foundation-recovery'
import { clearExplicitPath, markExplicitPath, paletteOverridePath } from '@/services/foundation-provenance'
import { applyPaletteOverrides, generatePalette } from '@/services/palette-generator'
import { migrateThemeState } from '@/models/theme.model'
import type { ResolveRequest, ResolveResult, ThemeOverride, ThemeState, ThemeStateV2, ThemeStateV4 } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveThemeValue } from '@/services/theme-resolver'
import { deserializeTheme } from '@/services/theme-serialization'
import { validateThemeOverride } from '@/services/theme-validation'
import { validateRawElementOverride, validateRawOverrides } from '@/services/raw-override-validation'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { IconPackName, ResourceIconKey } from '@/models/icons.model'
import { createDefaultIconConfiguration, validateIconConfiguration } from '@/registry/icon-registry'
import { createDefaultPanelBrandingSettings, validatePanelBrandingSettings } from '@/services/panel-branding-validation'
import type { PanelBrandingSettings, PanelBrandingSetting } from '@/models/panel-branding.model'

const storageKey = 'ftb-theme'
const registry = createThemeRegistry()
const defaultTheme = createDefaultThemeState()

export const useThemeStore = defineStore('theme', () => {
  const theme = ref<ThemeStateV4>(restoreTheme())
  const legacyRecovery = ref(readLegacyRecovery())
  const legacyRecoveryErrorMessage = ref(legacyRecoveryError(legacyRecovery.value))
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

  function applyTheme(value: ThemeStateV4): void {
    applyingHistory = true
    theme.value = structuredClone(value)
    applyingHistory = false
  }

  return {
    theme: readonly(theme),
    canUndo: computed(() => historyIndex.value > 0),
    canRedo: computed(() => historyIndex.value < history.length - 1),
    setPrimaryColor(color: string): void {
      if (!/^#[\da-f]{6}$/i.test(color)) return
      const candidate = cloneTheme(theme.value)
      candidate.colors.primary = color.toLowerCase()
      const palette = candidate.foundations.palettes.primary
      palette.base = candidate.colors.primary
      markExplicitPath(candidate.foundations, 'palettes.primary.base')
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
    setRawOverride(selector: string, property: RawVisualProperty, value: string): void {
      const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
      const candidateOverride = {
        selector,
        properties: { ...(existing?.properties ?? {}), [property]: value },
      }
      if (!validateRawElementOverride(candidateOverride).valid) return
      const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== selector)
      rawOverrides.push(candidateOverride)
      theme.value = { ...cloneTheme(theme.value), rawOverrides }
    },
    resetRawProperty(selector: string, property: RawVisualProperty): void {
      const existing = theme.value.rawOverrides.find((override) => override.selector === selector)
      if (!existing || !(property in existing.properties)) return
      const properties = { ...existing.properties }
      delete properties[property]
      const rawOverrides = theme.value.rawOverrides
        .filter((override) => override.selector !== selector)
        .concat(Object.keys(properties).length > 0 ? [{ selector, properties }] : [])
      theme.value = { ...cloneTheme(theme.value), rawOverrides }
    },
    resetRawOverride(selector: string): void {
      if (!theme.value.rawOverrides.some((override) => override.selector === selector)) return
      theme.value = { ...cloneTheme(theme.value), rawOverrides: theme.value.rawOverrides.filter((override) => override.selector !== selector) }
    },
    renameRawOverride(fromSelector: string, toSelector: string): void {
      if (fromSelector === toSelector) return
      const existing = theme.value.rawOverrides.find((override) => override.selector === fromSelector)
      if (!existing || theme.value.rawOverrides.some((override) => override.selector === toSelector)) return
      const candidate = { selector: toSelector, properties: structuredClone(existing.properties) }
      if (!validateRawElementOverride(candidate).valid) return
      const rawOverrides = theme.value.rawOverrides.filter((override) => override.selector !== fromSelector)
      rawOverrides.push(candidate)
      theme.value = { ...cloneTheme(theme.value), rawOverrides }
    },
    setFoundation(path: string, value: unknown): void {
      if (isDerivedShadePath(path) || !isEditableFoundationPath(path)) return
      const candidate = cloneTheme(theme.value)
      if (!setPath(candidate.foundations as unknown as Record<string, unknown>, path, value)) return
      markExplicitPath(candidate.foundations, path)
      syncPalette(candidate, path)
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    resetFoundation(path: string): void {
      if (isDerivedShadePath(path)) return
      const defaults = createDefaultFoundationState()
      const paletteOverride = /^palettes\.(primary|success|warning|danger|info|gray)\.overrides\.(50|100|200|300|400|500|600|700|800|900|950)$/.exec(path)
      if (!isEditableFoundationPath(path) && !paletteOverride) return
      if (paletteOverride) {
        const candidate = cloneTheme(theme.value)
        const palette = candidate.foundations.palettes[paletteOverride[1] as PaletteName]
        delete palette.overrides[Number(paletteOverride[2]) as PaletteShade]
        clearExplicitPath(candidate.foundations, path)
        rebuildPalette(palette)
        if (!validateFoundationState(candidate.foundations).valid) return
        theme.value = candidate
        return
      }
      const value = getPath(defaults as unknown as Record<string, unknown>, path)
      if (value === undefined) return
      const candidate = cloneTheme(theme.value)
      if (!setPath(candidate.foundations as unknown as Record<string, unknown>, path, value)) return
      if (!validateFoundationState(candidate.foundations).valid) return
      clearExplicitPath(candidate.foundations, path)
      syncPalette(candidate, path)
      theme.value = candidate
    },
    setPaletteBase(name: PaletteName, value: string): void {
      if (!/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)) return
      const candidate = cloneTheme(theme.value)
      const palette = candidate.foundations.palettes[name]
      palette.base = value.toLowerCase()
      markExplicitPath(candidate.foundations, `palettes.${name}.base`)
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
      markExplicitPath(candidate.foundations, paletteOverridePath(name, shade))
      rebuildPalette(palette)
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    resetPaletteShade(name: PaletteName, shade: PaletteShade): void {
      if (!PALETTE_SHADES.includes(shade)) return
      const candidate = cloneTheme(theme.value)
      const palette = candidate.foundations.palettes[name]
      delete palette.overrides[shade]
      clearExplicitPath(candidate.foundations, paletteOverridePath(name, shade))
      rebuildPalette(palette)
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    setDensity(value: Density): void {
      if (value !== 'compact' && value !== 'default' && value !== 'spacious') return
      const candidate = cloneTheme(theme.value)
      candidate.foundations.density = value
      markExplicitPath(candidate.foundations, 'density')
      if (!validateFoundationState(candidate.foundations).valid) return
      theme.value = candidate
    },
    setIconPack(value: IconPackName): void {
      const candidate = cloneTheme(theme.value)
      candidate.icons = { ...candidate.icons, pack: value }
      if (!validateIconConfiguration(candidate.icons).valid) return
      theme.value = candidate
    },
    setSemanticResourceIcon(key: ResourceIconKey, icon: string): void {
      const candidate = cloneTheme(theme.value)
      candidate.icons.overrides[key] = icon
      if (!validateIconConfiguration(candidate.icons).valid) return
      theme.value = candidate
    },
    resetSemanticResourceIcon(key: ResourceIconKey): void {
      const candidate = cloneTheme(theme.value)
      delete candidate.icons.overrides[key]
      theme.value = candidate
    },
    resetIconConfiguration(): void {
      const candidate = cloneTheme(theme.value)
      candidate.icons = createDefaultIconConfiguration()
      theme.value = candidate
    },
    setBranding(settings: PanelBrandingSettings): void {
      const validation = validatePanelBrandingSettings(settings)
      if (!validation.valid) return
      theme.value = { ...cloneTheme(theme.value), branding: validation.settings }
    },
    setBrandingSetting(setting: PanelBrandingSetting, value: PanelBrandingSettings[PanelBrandingSetting]): void {
      const candidate = cloneTheme(theme.value)
      const next = { ...candidate.branding, [setting]: value }
      const validation = validatePanelBrandingSettings(next)
      if (!validation.valid) return
      candidate.branding = validation.settings
      theme.value = candidate
    },
    resetBranding(): void {
      theme.value = { ...cloneTheme(theme.value), branding: createDefaultPanelBrandingSettings() }
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
    legacyRecoveryAvailable: computed(() => legacyRecovery.value !== null),
    legacyRecoveryError: computed(() => legacyRecoveryErrorMessage.value),
    getLegacyRecoveryJson(): string | null {
      return legacyRecovery.value
    },
    restoreLegacyRecovery(): boolean {
      const error = legacyRecoveryError(legacyRecovery.value)
      if (error !== null) {
        legacyRecoveryErrorMessage.value = error
        return false
      }
      const restored = restoreLegacyTheme(legacyRecovery.value)
      if (restored === null) {
        legacyRecoveryErrorMessage.value = 'Archived theme could not be restored.'
        return false
      }
       applyTheme(restored)
      clearLegacyRecovery()
      legacyRecovery.value = null
      legacyRecoveryErrorMessage.value = null
      return true
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

function restoreTheme(): ThemeStateV4 {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    if (value) {
      let parsed: unknown
      try {
        parsed = JSON.parse(value)
      } catch {
        archiveLegacyTheme(value)
        return structuredClone(defaultTheme)
      }
      if (isVersionFour(parsed) || isLegacyVersionThree(parsed)) {
        const current = isVersionFour(parsed) ? parsed : migrateCurrentVersion(parsed)
        if (!hasTrustedProvenance(current)) archiveLegacyTheme(value)
        const normalized = normalizeTheme(current)
        const validation = validateFoundationState(normalized.foundations)
        if (validation.valid) {
          if (!hasTrustedProvenance(current)) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(serializeTheme(normalized)))
            } catch {
              // A storage failure must not prevent the native baseline from loading.
            }
          }
          return normalized
        }
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

function hasTrustedProvenance(value: ThemeStateV4): boolean {
  return value.foundations.provenanceVersion === 1
}

function migrateToCurrent(state: ThemeState): ThemeStateV4 {
  if (isVersionFour(state)) return normalizeTheme(state)
  if (isLegacyVersionThree(state)) return migrateCurrentVersion(state)
  const legacy = migrateThemeState(state)
  const current = createDefaultThemeState()
  const defaultPrimary = current.colors.primary
  current.colors.primary = legacy.colors.primary
  current.foundations.palettes.primary.base = legacy.colors.primary
  if (legacy.colors.primary !== defaultPrimary) {
    markExplicitPath(current.foundations, 'palettes.primary.base')
  }
  current.overrides = structuredClone(legacy.overrides)
  current.rawOverrides = []
  normalizePalettes(current)
  return current
}

function normalizeTheme(value: ThemeStateV4): ThemeStateV4 {
  const normalized = cloneTheme(value)
  if (!Array.isArray(normalized.rawOverrides) || !validateRawOverrides(normalized.rawOverrides).valid) normalized.rawOverrides = []
  if (!normalized.icons) normalized.icons = createDefaultIconConfiguration()
  if (!normalized.branding) normalized.branding = createDefaultPanelBrandingSettings()
  if (normalized.foundations.provenanceVersion !== 1) {
    // Pre-provenance values cannot distinguish a deliberate edit from a builder
    // default. Keep overrides, but restore the only safe foundation baseline.
    normalized.foundations = createDefaultFoundationState()
    normalized.colors.primary = normalized.foundations.palettes.primary.base
  }
  normalizePalettes(normalized)
  return normalized
}

function normalizePalettes(value: ThemeStateV4): void {
  value.colors.primary = value.foundations.palettes.primary.base
  for (const palette of Object.values(value.foundations.palettes)) rebuildPalette(palette)
}

function serializeTheme(value: ThemeStateV4): unknown {
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

function sameTheme(left: ThemeStateV4, right: ThemeStateV4): boolean {
  return JSON.stringify(left) === JSON.stringify(right)
}

function snapshot(value: ThemeStateV4): ThemeStateV4 {
  return structuredClone(JSON.parse(JSON.stringify(toRaw(value))) as ThemeStateV4)
}

function cloneTheme(value: ThemeStateV4): ThemeStateV4 {
  return structuredClone(JSON.parse(JSON.stringify(toRaw(value))) as ThemeStateV4)
}

function rebuildPalette(palette: ThemeStateV4['foundations']['palettes'][PaletteName]): void {
  palette.shades = applyPaletteOverrides(generatePalette(palette.base), palette.overrides)
}

function syncPalette(theme: ThemeStateV4, path: string): void {
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

function toLegacyTheme(value: ThemeStateV4): ThemeStateV2 {
  return {
    schemaVersion: 2,
    colors: { primary: value.colors.primary },
    overrides: structuredClone(JSON.parse(JSON.stringify(toRaw(value.overrides)))),
  }
}

function getPath(root: Record<string, unknown>, path: string): unknown {
  return foundationPathSegments(path).reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, root)
}

function setPath(root: Record<string, unknown>, path: string, value: unknown): boolean {
  const keys = foundationPathSegments(path)
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

function foundationPathSegments(path: string): string[] {
  const keys = path.split('.')
  if (keys[0] === 'spacing' && keys.length === 3) {
    const exactKey = `${keys[1]}.${keys[2]}`
    if (exactKey === '0.5' || exactKey === '1.5') return ['spacing', exactKey]
  }
  return keys
}

function selectMode<T>(values: Record<string, { light: T; dark: T }>, mode: ThemeMode): Record<string, T> {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value[mode]]))
}

function isVersionFour(value: unknown): value is ThemeStateV4 {
  return isRecord(value) && value.schemaVersion === 4 && Array.isArray(value.rawOverrides)
}

function isLegacyVersionThree(value: unknown): value is import('@/models/theme.model').ThemeStateV3 {
  return isRecord(value) && value.schemaVersion === 3
}

function migrateCurrentVersion(value: import('@/models/theme.model').ThemeStateV3): ThemeStateV4 {
  return { ...structuredClone(value), schemaVersion: 4, rawOverrides: [] }
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
