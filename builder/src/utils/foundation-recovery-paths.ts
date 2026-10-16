import type { FoundationState, PaletteName } from '@/models/foundations.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { applyPaletteOverrides, generatePalette } from '@/utils/palette-generator'

export function mergeLegacyFoundations(defaults: FoundationState, legacy: Record<string, unknown>): FoundationState {
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
  return paths.filter((path) => path !== 'explicitPaths' && path !== 'provenanceVersion' && legacyValueExists(legacy, path))
}

function legacyValueExists(legacy: Record<string, unknown>, path: string): boolean {
  return path.split('.').reduce<unknown>((value, key) => isRecord(value) ? value[key] : undefined, legacy) !== undefined
}

export function isRecord(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
