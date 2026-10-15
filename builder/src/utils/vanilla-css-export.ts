import type { FoundationProjection, ThemeMode } from '@/models/foundations.model'
import type { ThemeStateV4 } from '@/models/theme.model'
import { SUPPORTED_PSEUDO_STATES } from '@/models/theme-registry.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { projectFoundations } from '@/utils/foundation-projection'
import { validateRawElementOverride } from '@/utils/raw-override-validation'

const semanticMappings = new Map([
  ['button.primary\u0000background', { selector: '.fi-btn.fi-color-primary', globalSelector: '.fi-btn', componentSelector: '.fi-btn', property: 'background-color' }],
  ['button.secondary\u0000background', { selector: '.fi-btn.fi-outlined', globalSelector: '.fi-btn', componentSelector: '.fi-btn', property: 'background-color' }],
  ['form.product-name\u0000background', { selector: '.fi-fo-text-input .fi-input', globalSelector: '.fi-input', componentSelector: '.fi-fo-text-input .fi-input', property: 'background-color' }],
  ['global.primary\u0000primary', { selector: '.fi-color-primary', property: 'color' }],
])

export type VanillaCssExportResult = { css: string; errors: string[] }

export function exportVanillaCss(theme: Readonly<ThemeStateV4>): VanillaCssExportResult {
  const canonical = theme as ThemeStateV4
  const errors: string[] = []
  const sections = [
    '/* Generated with Filament Theme Builder */',
    '',
    '/* Foundations */',
    renderFoundations(canonical, 'light'),
    renderDarkFoundations(canonical),
    '',
    '/* Semantic overrides */',
    renderSemanticOverrides(canonical, errors),
    '',
    '/* Advanced raw-element overrides */',
    renderRawOverrides(canonical, errors),
    '',
  ]
  return { css: sections.filter((section, index) => section !== '' || index > 0).join('\n'), errors }
}

function renderFoundations(theme: ThemeStateV4, mode: ThemeMode): string {
  return renderProjection(projectFoundations(theme.foundations, mode))
}

function renderDarkFoundations(theme: ThemeStateV4): string {
  const rules = renderProjection(projectFoundations(theme.foundations, 'dark'))
  return rules ? `.dark {\n${indent(rules)}\n}` : ''
}

function renderProjection(projection: FoundationProjection): string {
  const rules: string[] = []
  for (const mapping of projection.mappings) {
    const value = cssValue(mapping.value)
    if (mapping.variable) rules.push(`:root { ${mapping.variable}: ${value}; }`)
    if (mapping.id.startsWith('palette.')) {
      if (mapping.id.endsWith('.base') && mapping.variable) {
        rules.push(`${mapping.selectors?.join(', ')} { --ftb-palette: var(${mapping.variable}); }`)
      }
      if (mapping.id.includes('.shades.') && mapping.variable) {
        rules.push(`${mapping.selectors?.join(', ')} { ${mapping.variable}: ${value}; }`)
      }
      continue
    }
    const selectors = mapping.selectors?.join(', ')
    if (!selectors) continue
    if (mapping.property === 'color') {
      const property = mapping.id.startsWith('surface.') ? 'background-color' : mapping.id.startsWith('border.') ? 'border-color' : 'color'
      rules.push(`${selectors} { ${property}: ${value}; }`)
    } else if (mapping.property === 'fontFamily') {
      rules.push(`${selectors} { font-family: ${quoteFamily(String(mapping.value))}; }`)
    } else if (mapping.property === 'spacing') {
      rules.push(`${selectors} { padding-block: ${value}px; }`)
    } else if (mapping.property === 'radius') {
      rules.push(`${selectors} { border-radius: ${radiusValue(String(mapping.value))}; }`)
    } else if (mapping.property === 'borderWidth') {
      rules.push(`${selectors} { border-width: ${value}px; }`)
    } else if (mapping.property === 'shadow') {
      rules.push(`${selectors} { box-shadow: ${shadowValue(String(mapping.value))}; }`)
    }
  }
  return rules.join('\n')
}

function renderSemanticOverrides(theme: ThemeStateV4, errors: string[]): string {
  return theme.overrides
    .slice()
    .sort((left, right) => semanticOverrideKey(left).localeCompare(semanticOverrideKey(right)))
    .flatMap((override) => {
      const mapping = semanticMappings.get(`${override.targetId}\u0000${override.controlId}`)
      if (!mapping) { errors.push(`Unsupported semantic override: ${override.targetId}.${override.controlId}`); return [] }
      if (typeof override.value !== 'string') { errors.push(`Unsupported semantic override value: ${override.targetId}.${override.controlId}`); return [] }
      try {
        const selector = semanticSelector(override, mapping)
        return [`${selector} { ${mapping.property}: ${override.value} !important; }`]
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unsupported semantic override')
        return []
      }
    })
    .filter(Boolean)
    .join('\n')
}

type SemanticMapping = {
  selector: string
  globalSelector?: string
  componentSelector?: string
  property: string
}

function semanticSelector(override: ThemeStateV4['overrides'][number], mapping: SemanticMapping): string {
  const baseSelector = override.scope === 'global'
    ? mapping.globalSelector ?? mapping.selector
    : override.scope === 'component'
      ? mapping.componentSelector ?? mapping.selector
      : mapping.selector

  if (override.scope !== 'state') return baseSelector
  const registryEntry = createThemeRegistry().entries.find(({ id }) => id === override.targetId)
  if (!override.stateId || !registryEntry?.states.includes(override.stateId) || (override.stateId !== 'default' && !(SUPPORTED_PSEUDO_STATES as readonly string[]).includes(override.stateId))) {
    throw new Error(`Unsupported semantic override state: ${override.targetId}.${override.controlId}.${override.stateId ?? 'missing'}`)
  }
  return override.stateId === 'default' ? baseSelector : `${baseSelector}:${override.stateId}`
}

function semanticOverrideKey(override: ThemeStateV4['overrides'][number]): string {
  return [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000')
}

function renderRawOverrides(theme: ThemeStateV4, errors: string[]): string {
  if (!Array.isArray(theme.rawOverrides)) {
    errors.push('Raw overrides must be an array')
    return ''
  }
  const seenSelectors = new Set<string>()
  const validOverrides = theme.rawOverrides.flatMap((candidate) => {
    const validation = validateRawElementOverride(candidate)
    if (!validation.valid) { errors.push(validation.error); return [] }
    if (seenSelectors.has(validation.value.selector)) { errors.push(`Duplicate raw selector: ${validation.value.selector}`); return [] }
    seenSelectors.add(validation.value.selector)
    return [validation.value]
  })
  return validOverrides
    .sort((left, right) => left.selector.localeCompare(right.selector))
    .map((override) => {
      const declarations = Object.entries(override.properties)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([property, value]) => `  ${property}: ${value};`)
        .join('\n')
      return `${override.selector} {\n${declarations}\n}`
    })
    .join('\n')
}

function cssValue(value: string | number): string {
  return typeof value === 'number' ? String(value) : value
}

function quoteFamily(value: string): string {
  return value.includes(',') ? value : `"${value.split('"').join('\\"')}"`
}

function radiusValue(value: string): string {
  return ({ none: '0px', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' } as Record<string, string>)[value] ?? value
}

function shadowValue(value: string): string {
  return ({ none: 'none', sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)' } as Record<string, string>)[value] ?? value
}

function indent(value: string): string {
  return value.split('\n').map((line) => `  ${line}`).join('\n')
}
