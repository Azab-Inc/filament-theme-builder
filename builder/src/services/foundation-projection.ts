import { FILAMENT_FOUNDATION_INVENTORY } from '@/registry/filament-foundation-inventory'
import type { FoundationProjection, FoundationState, ThemeMode } from '@/models/foundations.model'

const PREVIEW_MAPPINGS = FILAMENT_FOUNDATION_INVENTORY.filter(
  (entry) => entry.mapping === 'preview-emulatable',
)

export function projectFoundations(state: FoundationState, mode: ThemeMode): FoundationProjection {
  return {
    schemaVersion: 1,
    compatibility: 'filament-5.9',
    mode,
    mappings: PREVIEW_MAPPINGS.map((entry) => ({
      id: entry.id,
      mapping: entry.mapping,
      ...(entry.selector === undefined ? {} : { selector: entry.selector }),
      ...(entry.variable === undefined ? {} : { variable: entry.variable }),
      value: foundationValue(state, entry.id),
    })),
  }
}

function foundationValue(state: FoundationState, id: string): string | number {
  if (id === 'palette.primary.base') return state.palettes.primary.base

  const shade = id.match(
    /^palette\.primary\.shades\.(50|100|200|300|400|500|600|700|800|900|950)$/,
  )?.[1]
  if (shade !== undefined) {
    const shadeKey = Number(shade) as keyof typeof state.palettes.primary.shades
    return (
      state.palettes.primary.overrides[shadeKey] ??
      state.palettes.primary.shades[shadeKey] ??
      state.palettes.primary.base
    )
  }

  throw new Error(`No projection value exists for inventory mapping: ${id}`)
}
