import type { Density, DensityPreset, FoundationState, FoundationStateV3, PaletteName } from '@/models/foundations.model'
import { PALETTE_NAMES } from '@/models/foundations.model'
import { generatePalette } from '@/services/palette-generator'

const PALETTE_BASES: Record<PaletteName, string> = {
  primary: '#6366f1',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  gray: '#6b7280',
}

const SYSTEM_BODY_FONT = Object.freeze({
  kind: 'system' as const,
  name: 'System',
  family: 'ui-sans-serif, system-ui, sans-serif',
})

const SYSTEM_HEADING_FONT = Object.freeze({
  kind: 'system' as const,
  name: 'System',
  family: 'ui-sans-serif, system-ui, sans-serif',
})

const SYSTEM_MONO_FONT = Object.freeze({
  kind: 'system' as const,
  name: 'System Mono',
  family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
})

const FOUNDATION_DEFAULTS: FoundationState = deepFreeze({
  palettes: Object.fromEntries(PALETTE_NAMES.map((name) => {
    const base = PALETTE_BASES[name]

    const shades = generatePalette(base)

    return [name, { base, shades, overrides: {} }]
  })) as FoundationState['palettes'],
  surfaces: {
    page: { light: 'var(--gray-50)', dark: 'var(--gray-900)' },
    sidebar: { light: '#ffffff', dark: 'var(--gray-800)' },
    topbar: { light: '#ffffff', dark: 'var(--gray-800)' },
    card: { light: '#ffffff', dark: 'var(--gray-800)' },
    elevated: { light: '#ffffff', dark: 'var(--gray-700)' },
    input: { light: '#ffffff', dark: 'var(--gray-800)' },
  },
  borders: {
    default: { light: 'var(--gray-200)', dark: 'var(--gray-700)' },
    strong: { light: 'var(--gray-300)', dark: 'var(--gray-600)' },
  },
  text: {
    primary: { light: 'var(--gray-950)', dark: 'var(--gray-50)' },
    muted: { light: 'var(--gray-500)', dark: 'var(--gray-400)' },
    disabled: { light: 'var(--gray-400)', dark: 'var(--gray-500)' },
  },
  typography: {
    body: SYSTEM_BODY_FONT,
    heading: SYSTEM_HEADING_FONT,
    mono: SYSTEM_MONO_FONT,
  },
  spacing: { '0': 0, px: 1, '0.5': 2, '1': 4, '1.5': 6, '2': 8, '3': 12, '4': 16, '6': 24, '8': 32 },
  density: 'default',
  radius: 'md',
  borderWidth: 1,
  shadow: 'sm',
  explicitPaths: [],
  provenanceVersion: 1,
})

const DENSITY_PRESETS: Record<Density, DensityPreset> = deepFreeze({
  compact: { controlHeight: 32, spacing: { '1': 4, '2': 6, '3': 8, '4': 12 } },
  default: { controlHeight: 40, spacing: { '1': 4, '2': 8, '3': 12, '4': 16 } },
  spacious: { controlHeight: 48, spacing: { '1': 6, '2': 12, '3': 16, '4': 24 } },
})

export function createDefaultFoundationState(): FoundationState {
  return structuredClone(FOUNDATION_DEFAULTS)
}

export function createDefaultThemeState(): FoundationStateV3 {
  return {
    schemaVersion: 3,
    colors: { primary: PALETTE_BASES.primary },
    foundations: createDefaultFoundationState(),
    overrides: [],
    customCss: '',
  }
}

export function densityPreset(value: Density): DensityPreset {
  return structuredClone(DENSITY_PRESETS[value])
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
  }

  return value
}
