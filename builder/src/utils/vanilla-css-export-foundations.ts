import type { FoundationProjection, ThemeMode } from '@/models/foundations.model'
import type { ThemeStateInput } from '@/models/theme.model'
import { projectFoundations } from '@/utils/foundation-projection'

export function renderFoundations(theme: ThemeStateInput, mode: ThemeMode): string {
  return renderProjection(projectFoundations(theme.foundations, mode))
}

export function renderDarkFoundations(theme: ThemeStateInput): string {
  const rules = renderProjection(projectFoundations(theme.foundations, 'dark'))
  return rules ? `.dark {\n${indent(rules)}\n}` : ''
}

function renderProjection(projection: FoundationProjection): string {
  const rules: string[] = []
  for (const mapping of projection.mappings) {
    const value = typeof mapping.value === 'number' ? String(mapping.value) : mapping.value
    if (mapping.variable) rules.push(`:root { ${mapping.variable}: ${value}; }`)
    if (mapping.id.startsWith('palette.')) {
      if (mapping.id.endsWith('.base') && mapping.variable) rules.push(`${mapping.selectors?.join(', ')} { --ftb-palette: var(${mapping.variable}); }`)
      if (mapping.id.includes('.shades.') && mapping.variable) rules.push(`${mapping.selectors?.join(', ')} { ${mapping.variable}: ${value}; }`)
      continue
    }
    const selectors = mapping.selectors?.join(', ')
    if (!selectors) continue
    if (mapping.property === 'color') {
      const property = mapping.id.startsWith('surface.') ? 'background-color' : mapping.id.startsWith('border.') ? 'border-color' : 'color'
      rules.push(`${selectors} { ${property}: ${value}; }`)
    } else if (mapping.property === 'fontFamily') rules.push(`${selectors} { font-family: ${quoteFamily(String(mapping.value))}; }`)
    else if (mapping.property === 'spacing') rules.push(`${selectors} { padding-block: ${value}px; }`)
    else if (mapping.property === 'radius') rules.push(`${selectors} { border-radius: ${radiusValue(String(mapping.value))}; }`)
    else if (mapping.property === 'borderWidth') rules.push(`${selectors} { border-width: ${value}px; }`)
    else if (mapping.property === 'shadow') rules.push(`${selectors} { box-shadow: ${shadowValue(String(mapping.value))}; }`)
  }
  return rules.join('\n')
}

function quoteFamily(value: string): string { return value.includes(',') ? value : `"${value.split('"').join('\\"')}"` }
function radiusValue(value: string): string { return ({ none: '0px', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' } as Record<string, string>)[value] ?? value }
function shadowValue(value: string): string { return ({ none: 'none', sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } as Record<string, string>)[value] ?? value }
function indent(value: string): string { return value.split('\n').map((line) => `  ${line}`).join('\n') }
