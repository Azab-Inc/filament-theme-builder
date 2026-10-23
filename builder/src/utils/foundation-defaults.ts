import type { Density, DensityPreset, FoundationState, FoundationStateV4 } from '@/models/foundations.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import { PALETTE_NAMES } from '@/models/foundations.model'
import { generatePalette } from '@/utils/palette-generator'
import { createDefaultIconConfiguration } from '@/registry/icon-registry'
import { createDefaultPanelBrandingSettings } from '@/utils/panel-branding-validation'
import { deepFreeze, DENSITY_PRESETS, PALETTE_BASES, SYSTEM_BODY_FONT, SYSTEM_HEADING_FONT, SYSTEM_MONO_FONT } from '@/utils/foundation-defaults-data'

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

export function createDefaultFoundationState(): FoundationState {
  return structuredClone(FOUNDATION_DEFAULTS)
}

export function createDefaultThemeState(): FoundationStateV4 {
  return {
    schemaVersion: 4,
    colors: { primary: PALETTE_BASES.primary },
    foundations: createDefaultFoundationState(),
    overrides: [],
    rawOverrides: [],
    customCss: '',
    icons: createDefaultIconConfiguration(),
    branding: createDefaultPanelBrandingSettings(),
  }
}

export function createDefaultCurrentThemeState(): ThemeStateV5 {
  return { ...createDefaultThemeState(), schemaVersion: 5, padding: [] }
}

export function densityPreset(value: Density): DensityPreset {
  return structuredClone(DENSITY_PRESETS[value])
}
