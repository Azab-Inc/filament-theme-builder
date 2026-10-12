import { FILAMENT_FOUNDATION_INVENTORY } from '@/registry/filament-foundation-inventory'
import type { FoundationProjection, FoundationState, ThemeMode } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/services/foundation-defaults'

const PREVIEW_MAPPINGS = FILAMENT_FOUNDATION_INVENTORY.filter((entry) =>
  entry.mapping === 'preview-emulatable' || entry.mapping === 'live-emulation',
)
const DEFAULT_FOUNDATIONS = createDefaultFoundationState()

export function projectFoundations(state: FoundationState, mode: ThemeMode): FoundationProjection {
  return {
    schemaVersion: 1,
    compatibility: 'filament-5.9',
    mode,
    mappings: PREVIEW_MAPPINGS.filter((entry) => {
      const paletteName = /^palette\.([^.]+)\./.exec(entry.id)?.[1]
      return paletteName === undefined || isPaletteTouched(state, paletteName as keyof FoundationState['palettes'])
    }).map((entry) => ({
      id: entry.id,
      mapping: entry.mapping,
      ...(entry.selectors.length === 0 ? {} : { selectors: entry.selectors }),
      ...(entry.variable === undefined ? {} : { variable: entry.variable }),
      property: entry.property,
      value: foundationValue(state, entry.id, mode),
    })),
  }
}

function isPaletteTouched(state: FoundationState, name: keyof FoundationState['palettes']): boolean {
  const palette = state.palettes[name]
  const defaults = DEFAULT_FOUNDATIONS.palettes[name]

  return palette.base !== defaults.base || Object.keys(palette.overrides).length > 0
}

function foundationValue(state: FoundationState, id: string, mode: ThemeMode): string | number {
  if (id === 'density') return state.density
  if (id === 'radius') return state.radius
  if (id === 'borderWidth') return state.borderWidth
  if (id === 'shadow') return state.shadow

  const paletteBase = id.match(/^palette\.(primary|success|warning|danger|info|gray)\.base$/)
  if (paletteBase) return state.palettes[paletteBase[1] as keyof FoundationState['palettes']].base

  const shade = id.match(
    /^palette\.(primary|success|warning|danger|info|gray)\.shades\.(50|100|200|300|400|500|600|700|800|900|950)$/,
  )?.[1]
  if (shade !== undefined) {
    const [, paletteName, shadeName] = /^palette\.([^.]+)\.shades\.(\d+)$/.exec(id) ?? []
    const palette = state.palettes[paletteName as keyof FoundationState['palettes']]
    const shadeKey = Number(shadeName) as keyof typeof palette.shades
    return (
      palette.overrides[shadeKey] ??
      palette.shades[shadeKey] ??
      palette.base
    )
  }

  const modeValue = id.match(/^(surface|border|text)\.(.+)$/)
  if (modeValue) {
    const collection = modeValue[1] === 'surface' ? state.surfaces : modeValue[1] === 'border' ? state.borders : state.text
    return collection[modeValue[2] as keyof typeof collection][mode]
  }

  const typography = id.match(/^typography\.(body|heading|mono)$/)
  if (typography) return state.typography[typography[1] as keyof FoundationState['typography']].family

  const spacing = id.match(/^spacing\.(.+)$/)
  if (spacing) return state.spacing[spacing[1]!]!

  throw new Error(`No projection value exists for inventory mapping: ${id}`)
}
