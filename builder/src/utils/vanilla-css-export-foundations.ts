import type { FoundationProjection, ThemeMode } from '@/models/foundations.model'
import type { ThemeStateInput } from '@/models/theme.model'
import { projectFoundations } from '@/utils/foundation-projection'
import { themeColorVariables } from '@/utils/theme-color-variables'
import { userTokenCssValue } from '@/utils/user-token-css'
import { resolveModeValue } from '@/utils/foundation-provenance'

export function renderFoundations(theme: ThemeStateInput, mode: ThemeMode): string {
  return `${renderPaletteVariables(theme, mode)}\n${renderUserTokens(theme.foundations.userTokens, mode)}\n${renderProjection(referenceProjection(theme, mode), mode)}`
}

export function renderDarkFoundations(theme: ThemeStateInput): string {
  return `${renderPaletteVariables(theme, 'dark')}\n${renderUserTokens(theme.foundations.userTokens, 'dark')}\n${renderProjection(referenceProjection(theme, 'dark'), 'dark')}`
}

function referenceProjection(theme: ThemeStateInput, mode: ThemeMode): FoundationProjection {
  const projection = projectFoundations(theme.foundations, mode)
  for (const mapping of projection.mappings) {
    const match = /^(surface|border|text)\.(.+)$/.exec(mapping.id)
    if (!match) continue
    const group = match[1] === 'surface' ? 'surfaces' : match[1] === 'border' ? 'borders' : 'text'
    const values = theme.foundations[group] as Record<string, { light: string; dark: string }>
    const value = resolveModeValue(theme.foundations, values[match[2]!]!, group, match[2]!, mode)
    if (value.startsWith('user.')) mapping.value = userTokenCssValue(value, theme.foundations.userTokens) ?? ''
  }
  return projection
}

function renderUserTokens(tokens: import('@/models/user-tokens.model').UserTokens | undefined, mode: ThemeMode): string {
  if (!tokens) return ''
  const guard = `:where(html${mode === 'dark' ? '.dark' : ':not(.dark)'})`
  const lines: string[] = []
  for (const [name, token] of Object.entries(tokens.colors)) lines.push(`${guard} { --ftb-user-color-${name}: ${token[mode] ?? token.light}; }`)
  for (const [name, palette] of Object.entries(tokens.palettes)) for (const [shade, value] of Object.entries(palette.shades)) lines.push(`${guard} { --ftb-user-palette-${name}-${shade}: ${value[mode] ?? value.light}; }`)
  return lines.join('\n')
}

function renderPaletteVariables(theme: ThemeStateInput, mode: ThemeMode): string {
  const guard = `:where(html${mode === 'dark' ? '.dark' : ':not(.dark)'})`
  return `${guard} { ${Object.entries(themeColorVariables(theme.foundations, mode)).map(([name, color]) => `${name}: ${color};`).join(' ')} }`
}

function renderProjection(projection: FoundationProjection, mode: ThemeMode = 'light'): string {
  const guard = `:where(html${mode === 'dark' ? '.dark' : ':not(.dark)'})`
  const rules: string[] = []
  for (const mapping of projection.mappings) {
    const value = typeof mapping.value === 'number' ? String(mapping.value) : mapping.value
    if (mapping.variable) rules.push(`${guard} { ${mapping.variable}: ${value}; }`)
    if (mapping.id.startsWith('palette.')) {
      if (mapping.id.endsWith('.base') && mapping.variable) rules.push(`${scopeSelectors(mapping.selectors, guard)} { --ftb-palette: var(${mapping.variable}); }`)
      if (mapping.id.includes('.shades.') && mapping.variable) rules.push(`${scopeSelectors(mapping.selectors, guard)} { ${mapping.variable}: ${value}; }`)
      continue
    }
    const selectors = mapping.selectors?.join(', ')
    if (!selectors) continue
    const scoped = scopeSelectors(mapping.selectors, guard)
    if (mapping.property === 'color') {
      const property = mapping.id.startsWith('surface.') ? 'background-color' : mapping.id.startsWith('border.') ? 'border-color' : 'color'
      rules.push(`${scoped} { ${property}: ${value}; }`)
    } else if (mapping.property === 'fontFamily') rules.push(`${scoped} { font-family: ${quoteFamily(String(mapping.value))}; }`)
    else if (mapping.property === 'spacing') rules.push(`${scoped} { padding-block: ${value}px; }`)
    else if (mapping.property === 'radius') rules.push(`${scoped} { border-radius: ${radiusValue(String(mapping.value))}; }`)
    else if (mapping.property === 'borderWidth') rules.push(`${scoped} { border-width: ${value}px; }`)
    else if (mapping.property === 'shadow') rules.push(`${scoped} { box-shadow: ${shadowValue(String(mapping.value))}; }`)
  }
  return rules.join('\n')
}

function quoteFamily(value: string): string { return value.includes(',') ? value : `"${value.split('"').join('\\"')}"` }
function radiusValue(value: string): string { return ({ none: '0px', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' } as Record<string, string>)[value] ?? value }
function shadowValue(value: string): string { return ({ none: 'none', sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } as Record<string, string>)[value] ?? value }
function scopeSelectors(selectors: readonly string[] | undefined, guard: string): string { return (selectors ?? []).map((selector) => `${guard} ${selector}`).join(', ') }
