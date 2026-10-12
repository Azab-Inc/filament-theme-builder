import type { FoundationState, FoundationStateV3, PaletteName } from '@/models/foundations.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultThemeState } from '@/services/foundation-defaults'
import { validateFoundationState } from '@/services/foundation-validation'
import type { ThemeOverride } from '@/models/theme.model'
import { applyPaletteOverrides, generatePalette } from '@/services/palette-generator'

export const LEGACY_RECOVERY_STORAGE_KEY = 'ftb-theme-legacy-recovery'

export function archiveLegacyTheme(value: unknown): void {
  if (typeof localStorage === 'undefined' || localStorage.getItem(LEGACY_RECOVERY_STORAGE_KEY) !== null) return
  try {
    localStorage.setItem(LEGACY_RECOVERY_STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value))
  } catch {
    // A storage failure cannot prevent native defaults from loading.
  }
}

export function readLegacyRecovery(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(LEGACY_RECOVERY_STORAGE_KEY)
}

export function clearLegacyRecovery(): void {
  try {
    localStorage.removeItem(LEGACY_RECOVERY_STORAGE_KEY)
  } catch {
    // Ignore unavailable storage.
  }
}

export function restoreLegacyTheme(value: unknown): FoundationStateV3 | null {
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!isRecord(value) || value.schemaVersion !== 3 || !isRecord(value.foundations)) return null
  const legacy = JSON.parse(JSON.stringify(value)) as Record<string, any>

  const defaults = createDefaultThemeState()
  const foundations = mergeLegacyFoundations(defaults.foundations, legacy.foundations)
  const restored: FoundationStateV3 = {
    schemaVersion: 3,
    colors: { primary: foundations.palettes.primary.base },
    foundations,
    overrides: Array.isArray(legacy.overrides) ? structuredClone(legacy.overrides) as ThemeOverride[] : [],
    customCss: typeof legacy.customCss === 'string' ? legacy.customCss : '',
  }

  const validation = validateFoundationState(restored)
  return validation.valid ? restored : null
}

export function legacyRecoveryError(value: string | null): string | null {
  if (value === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return 'Archived data is not valid JSON. You can download it, but it cannot be restored.'
  }
  if (!isRecord(parsed) || parsed.schemaVersion !== 3 || !isRecord(parsed.foundations)) {
    return 'Archived data does not match the supported legacy theme format and cannot be restored.'
  }
  if (restoreLegacyTheme(parsed) === null) {
    return 'Archived theme contains invalid or unsupported values and cannot be restored.'
  }
  return null
}

function mergeLegacyFoundations(defaults: FoundationState, legacy: Record<string, unknown>): FoundationState {
  const restored = structuredClone(defaults)
  for (const key of ['surfaces', 'borders', 'text', 'typography', 'spacing'] as const) {
    if (isRecord(legacy[key])) Object.assign(restored[key], structuredClone(legacy[key]))
  }
  if (isRecord(legacy.palettes)) {
    for (const name of PALETTE_NAMES) {
      const palette = legacy.palettes[name]
      if (!isRecord(palette)) continue
      if (typeof palette.base === 'string') restored.palettes[name].base = palette.base
      if (isRecord(palette.overrides)) restored.palettes[name].overrides = structuredClone(palette.overrides) as FoundationState['palettes'][PaletteName]['overrides']
    }
  }
  for (const key of ['density', 'radius', 'borderWidth', 'shadow'] as const) {
    if (legacy[key] !== undefined) (restored as Record<string, unknown>)[key] = legacy[key]
  }
  restored.explicitPaths = legacyPaths(restored, defaults, legacy)
  for (const palette of Object.values(restored.palettes)) {
    palette.shades = applyPaletteOverrides(generatePalette(palette.base), palette.overrides)
  }
  return restored
}

function legacyPaths(restored: FoundationState, defaults: FoundationState, legacy: Record<string, unknown>): string[] {
  const paths: string[] = []
  for (const name of PALETTE_NAMES) {
    if (restored.palettes[name].base !== defaults.palettes[name].base) paths.push(`palettes.${name}.base`)
    for (const shade of PALETTE_SHADES) if (Object.prototype.hasOwnProperty.call(restored.palettes[name].overrides, shade)) paths.push(`palettes.${name}.overrides.${shade}`)
  }
  for (const collection of ['surfaces', 'borders', 'text', 'typography', 'spacing'] as const) {
    const value = restored[collection]
    const baseline = defaults[collection]
    for (const [key, current] of Object.entries(value)) {
      if (JSON.stringify(current) !== JSON.stringify(baseline[key as keyof typeof baseline])) {
        if (collection === 'spacing' || collection === 'typography') paths.push(`${collection}.${key}`)
        else for (const mode of ['light', 'dark'] as const) if (isRecord(current) && current[mode] !== baseline[key as keyof typeof baseline][mode]) paths.push(`${collection}.${key}.${mode}`)
      }
    }
  }
  for (const key of ['density', 'radius', 'borderWidth', 'shadow'] as const) if (restored[key] !== defaults[key]) paths.push(key)
  return paths.filter((path) => path !== 'explicitPaths' && path !== 'provenanceVersion' && (legacyValueExists(legacy, path)))
}

function legacyValueExists(legacy: Record<string, unknown>, path: string): boolean {
  return path.split('.').reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, legacy) !== undefined
}

function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
