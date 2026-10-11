export const PALETTE_NAMES = ['primary', 'success', 'warning', 'danger', 'info', 'gray'] as const
export type PaletteName = typeof PALETTE_NAMES[number]

export const PALETTE_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const
export type PaletteShade = typeof PALETTE_SHADES[number]

export type Density = 'compact' | 'default' | 'spacious'
export type ThemeMode = 'light' | 'dark'
export type FoundationMapping = 'preview-emulatable' | 'runtime-refresh-required' | 'export-only' | 'unmapped'

export type FontChoice =
  | { kind: 'system'; name: string; family: string }
  | { kind: 'curated'; name: string; family: string; provider: 'google-fonts' }
  | { kind: 'custom'; name: string; family: string }

export type PaletteState = {
  base: string
  shades: Partial<Record<PaletteShade, string>>
  overrides: Partial<Record<PaletteShade, string>>
}

export type FoundationState = {
  palettes: Record<PaletteName, PaletteState>
  surfaces: Record<'page' | 'sidebar' | 'topbar' | 'card' | 'elevated' | 'input', { light: string; dark: string }>
  borders: Record<'default' | 'strong', { light: string; dark: string }>
  text: Record<'primary' | 'muted' | 'disabled', { light: string; dark: string }>
  typography: { body: FontChoice; heading: FontChoice; mono: FontChoice }
  spacing: Record<string, number>
  density: Density
  radius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  borderWidth: number
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

export type ResolvedFoundation = Omit<FoundationState, 'surfaces' | 'borders' | 'text'> & {
  surfaces: Record<'page' | 'sidebar' | 'topbar' | 'card' | 'elevated' | 'input', string>
  borders: Record<'default' | 'strong', string>
  text: Record<'primary' | 'muted' | 'disabled', string>
}

export type FoundationStateV3 = {
  schemaVersion: 3
  colors: { primary: string }
  foundations: FoundationState
  overrides: import('@/models/theme.model').ThemeOverride[]
  customCss: string
}

export type FoundationValidationResult =
  | { valid: true; state: FoundationState }
  | { valid: false; code: 'unknown-key' | 'invalid-value' | 'unsafe-font' | 'duplicate-override' | 'unsupported-mapping'; path: string; message: string }

export type FoundationProjection = {
  schemaVersion: 1
  compatibility: 'filament-5.9'
  mode: ThemeMode
  mappings: Array<{ id: string; mapping: FoundationMapping; selector?: string; variable?: string; value: string | number }>
}

export type DensityPreset = {
  controlHeight: number
  spacing: Record<string, number>
}

export type FoundationControlMappingDefaults = {
  'text.disabled': FoundationMapping
  'borders.strong': FoundationMapping
}

export const DEFAULT_FOUNDATION_CONTROL_MAPPINGS: Readonly<FoundationControlMappingDefaults> = Object.freeze({
  'text.disabled': 'unmapped',
  'borders.strong': 'export-only',
})
