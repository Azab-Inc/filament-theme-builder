import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { themeColorVariables } from '@/utils/theme-color-variables'
import { projectFoundations } from '@/utils/foundation-projection'
import { resolvePaletteShade } from '@/utils/theme-store-palettes'
import { exportVanillaCss } from '@/utils/vanilla-css-export'
import { validateFoundationState } from '@/utils/foundation-validation'

describe('private theme palette variables', () => {
  it('exposes all canonical shades without editing native palettes or provenance', () => {
    const theme = createDefaultCurrentThemeState()
    const before = JSON.stringify(theme)
    const variables = themeColorVariables(theme.foundations, 'light')
    expect(Object.keys(variables)).toHaveLength(66)
    for (const name of PALETTE_NAMES) for (const shade of PALETTE_SHADES) expect(variables[`--ftb-palette-${name}-${shade}`]).toBe(resolvePaletteShade(theme.foundations.palettes[name], shade, 'light'))
    expect(projectFoundations(theme.foundations, 'light').mappings).toEqual([])
    expect(JSON.stringify(theme)).toBe(before)
  })

  it('keeps light and dark alias values independent while inheriting unedited shades', () => {
    const theme = createDefaultCurrentThemeState()
    theme.foundations.palettes.primary.dark = { overrides: { 500: '#abcdef' } }
    const light = themeColorVariables(theme.foundations, 'light')
    const dark = themeColorVariables(theme.foundations, 'dark')
    expect(light['--ftb-palette-primary-500']).toBe('#6366f1')
    expect(dark['--ftb-palette-primary-500']).toBe('#abcdef')
    expect(dark['--ftb-palette-primary-50']).toBe(light['--ftb-palette-primary-50'])
  })

  it('exports private references without changing unrelated native palette declarations', () => {
    const theme = createDefaultCurrentThemeState()
    theme.rawOverrides = [{ selector: '.fi-section', properties: { color: 'var(--ftb-palette-primary-50)' } }]
    const exported = exportVanillaCss(theme)
    expect(exported.errors).toEqual([])
    expect(exported.css).toContain(`--ftb-palette-primary-50: ${theme.foundations.palettes.primary.shades[50]}`)
    expect(exported.css).toContain('color: var(--ftb-palette-primary-50)')
    expect(exported.css).not.toContain('--primary-50:')
    expect(theme.foundations.explicitPaths).toEqual([])
  })

  it('rejects palette references as generation seeds at the canonical boundary', () => {
    const theme = createDefaultCurrentThemeState()
    theme.foundations.palettes.primary.base = 'var(--ftb-palette-danger-500)'
    expect(validateFoundationState(theme).valid).toBe(false)
  })

  it.each(['050', '5e2'])('rejects non-canonical shade keys %s rather than resolving different values across runtimes', (key) => {
    const theme = createDefaultCurrentThemeState()
    Object.assign(theme.foundations.palettes.primary.overrides, { [key]: '#123456' })
    expect(validateFoundationState(theme).valid).toBe(false)
    theme.foundations.palettes.primary.overrides = {}
    theme.foundations.palettes.primary.dark = { overrides: { [key]: '#123456' } }
    expect(validateFoundationState(theme).valid).toBe(false)
  })
})
