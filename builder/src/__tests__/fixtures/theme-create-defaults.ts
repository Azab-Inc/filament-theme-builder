import { expect } from 'vitest'
import { PALETTE_NAMES, type PaletteName } from '@/models/foundations.model'
import type { ThemeStateV4 } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { validateIconConfiguration } from '@/registry/icon-registry'
import { validatePanelBrandingSettings } from '@/utils/panel-branding-validation'
import { validateRawOverrides } from '@/utils/raw-override-validation'
import { validateThemeOverride } from '@/utils/theme-validation'
import { generatePalette } from '@/utils/palette-generator'

const paletteBases: Record<PaletteName, string> = {
  primary: '#123456', success: '#0f766e', warning: '#b45309',
  danger: '#b91c1c', info: '#0369a1', gray: '#374151',
}

export function createDirtyThemeState(): ThemeStateV4 {
  const state = createDefaultThemeState()
  for (const name of PALETTE_NAMES) {
    const base = paletteBases[name]
    const shades = generatePalette(base)
    const override = name === 'primary' ? '#654321' : '#765432'
    state.foundations.palettes[name] = { base, shades: { ...shades, 400: override }, overrides: { 400: override } }
  }
  state.colors.primary = paletteBases.primary
  for (const [name, light, dark] of [
    ['page', '#112233', '#223344'], ['sidebar', '#334455', '#445566'], ['topbar', '#556677', '#667788'],
    ['card', '#778899', '#8899aa'], ['elevated', '#99aabb', '#aabbcc'], ['input', '#bbccdd', '#ccddee'],
  ] as const) state.foundations.surfaces[name] = { light, dark }
  for (const [name, light, dark] of [['default', '#abcdef', '#123abc'], ['strong', '#345678', '#456789']] as const) state.foundations.borders[name] = { light, dark }
  for (const [name, light, dark] of [['primary', '#135790', '#2468a0'], ['muted', '#3579a0', '#468ab0'], ['disabled', '#579ab0', '#68abc0']] as const) state.foundations.text[name] = { light, dark }
  state.foundations.typography.body = { kind: 'custom', name: 'Brand Sans', family: 'Brand Sans' }
  state.foundations.typography.heading = { kind: 'custom', name: 'Display Sans', family: 'Display Sans' }
  state.foundations.typography.mono = { kind: 'custom', name: 'Code Mono', family: 'Code Mono' }
  state.foundations.spacing['4'] = 23; state.foundations.density = 'compact'
  state.foundations.radius = 'lg'; state.foundations.borderWidth = 3; state.foundations.shadow = 'xl'
  state.foundations.explicitPaths = ['palettes.primary.base', 'palettes.primary.overrides.400', 'surfaces.card.light', 'borders.default.dark', 'text.primary.dark', 'typography.body', 'spacing.4', 'density', 'radius', 'borderWidth', 'shadow']
  state.overrides = [
    { targetId: 'form.product-name', controlId: 'background', scope: 'component', componentId: 'form', value: '#112233' },
    { targetId: 'form.product-name', controlId: 'background', scope: 'variant', componentId: 'form', variantId: 'default', value: '#223344' },
  ]
  state.rawOverrides = [{ selector: '.fi-btn.fi-color-primary', properties: { 'background-color': '#e11d48' } }]
  state.icons = { pack: 'solid', overrides: { products: 'heroicon-o-cube', orders: 'heroicon-m-bolt', customers: 'heroicon-s-star', inventory: 'heroicon-o-heart' } }
  state.branding = {
    appName: 'Custom Panel', lightLogo: `${'a'.repeat(64)}/${'b'.repeat(40)}.png`,
    darkLogo: `${'c'.repeat(64)}/${'d'.repeat(40)}.webp`, favicon: `${'e'.repeat(64)}/${'f'.repeat(40)}.jpg`,
    logoHeight: '3rem', brandTypography: { kind: 'custom', name: 'Brand Sans', family: 'Brand Sans' },
    contentWidth: '4xl', sidebar: 'fully-collapsible',
  }
  return state
}

export function expectValidDirtyTheme(state: ThemeStateV4): void {
  expect(validateFoundationState(state.foundations)).toMatchObject({ valid: true })
  const registry = createThemeRegistry()
  for (const override of state.overrides) expect(validateThemeOverride(override, registry)).toMatchObject({ valid: true })
  expect(validateRawOverrides(state.rawOverrides)).toMatchObject({ valid: true })
  expect(validateIconConfiguration(state.icons)).toMatchObject({ valid: true })
  expect(validatePanelBrandingSettings(state.branding)).toMatchObject({ valid: true })
}
