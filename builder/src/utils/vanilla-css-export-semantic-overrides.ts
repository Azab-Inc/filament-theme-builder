import type { ThemeStateInput } from '@/models/theme.model'
import type { SemanticMapping } from '@/models/vanilla-css-export-semantic-mapping.model'
import { SUPPORTED_PSEUDO_STATES } from '@/models/theme-registry.model'
import { createThemeRegistry } from '@/registry/theme-registry'

const semanticMappings = new Map<string, SemanticMapping>([
  ['button.primary\u0000background', { selector: '.fi-btn.fi-color-primary', globalSelector: '.fi-btn', componentSelector: '.fi-btn', property: 'background-color' }],
  ['button.secondary\u0000background', { selector: '.fi-btn.fi-outlined', globalSelector: '.fi-btn', componentSelector: '.fi-btn', property: 'background-color' }],
  ['form.product-name\u0000background', { selector: '.fi-fo-text-input .fi-input', globalSelector: '.fi-input', componentSelector: '.fi-fo-text-input .fi-input', property: 'background-color' }],
  ['global.primary\u0000primary', { selector: '.fi-color-primary', property: 'color' }],
])

export function renderSemanticOverrides(theme: ThemeStateInput, errors: string[]): string {
  return theme.overrides.slice().sort((left, right) => semanticOverrideKey(left).localeCompare(semanticOverrideKey(right)))
    .flatMap((override) => {
      const mapping = semanticMappings.get(`${override.targetId}\u0000${override.controlId}`)
      if (!mapping) { errors.push(`Unsupported semantic override: ${override.targetId}.${override.controlId}`); return [] }
      if (typeof override.value !== 'string') { errors.push(`Unsupported semantic override value: ${override.targetId}.${override.controlId}`); return [] }
      try { return [`${semanticSelector(override, mapping)} { ${mapping.property}: ${override.value} !important; }`] }
      catch (error) { errors.push(error instanceof Error ? error.message : 'Unsupported semantic override'); return [] }
    }).filter(Boolean).join('\n')
}

function semanticSelector(override: ThemeStateInput['overrides'][number], mapping: SemanticMapping): string {
  const baseSelector = override.scope === 'global' ? mapping.globalSelector ?? mapping.selector
    : override.scope === 'component' ? mapping.componentSelector ?? mapping.selector : mapping.selector
  if (override.scope !== 'state') return baseSelector
  const registryEntry = createThemeRegistry().entries.find(({ id }) => id === override.targetId)
  if (!override.stateId || !registryEntry?.states.includes(override.stateId) || (override.stateId !== 'default' && !(SUPPORTED_PSEUDO_STATES as readonly string[]).includes(override.stateId))) {
    throw new Error(`Unsupported semantic override state: ${override.targetId}.${override.controlId}.${override.stateId ?? 'missing'}`)
  }
  return override.stateId === 'default' ? baseSelector : `${baseSelector}:${override.stateId}`
}

function semanticOverrideKey(override: ThemeStateInput['overrides'][number]): string {
  return [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000')
}
