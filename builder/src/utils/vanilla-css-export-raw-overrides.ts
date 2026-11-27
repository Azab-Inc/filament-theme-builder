import type { ThemeStateInput } from '@/models/theme.model'
import { validateRawElementOverride } from '@/utils/raw-override-validation'
import { userTokenCssValue } from '@/utils/user-token-css'
import { expandRawOverrideSelectors } from '@/utils/raw-override-selector-expansion'
import { BORDER_TARGET_CATALOG } from '@/registry/border-target-catalog'

const physicalBorderProperties = new Set([
  'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
])

export function renderRawOverrides(theme: ThemeStateInput, errors: string[]): string {
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
  const ordered = validOverrides.sort((left, right) => {
    const leftUnique = left.selector.startsWith('#')
    const rightUnique = right.selector.startsWith('#')
    if (leftUnique !== rightUnique) return Number(leftUnique) - Number(rightUnique)
    const leftIcon = /(?:^| )\.fi-sidebar-item-icon$/.test(left.selector)
    const rightIcon = /(?:^| )\.fi-sidebar-item-icon$/.test(right.selector)
    return Number(leftIcon) - Number(rightIcon) || left.selector.localeCompare(right.selector)
  })
  const render = (override: typeof ordered[number], properties: Record<string, string>, prefix = '') => {
    return expandRawOverrideSelectors(override.selector).map((selector) => {
      const projectedProperties = selector === override.selector
        ? properties
        : Object.fromEntries(Object.entries(properties).filter(([property]) => property === 'color'))
      if (!Object.keys(projectedProperties).length) return ''
      const declarations = Object.entries(projectedProperties).sort(([left], [right]) => left.localeCompare(right))
        .map(([property, value]) => { const css = userTokenCssValue(value, theme.foundations.userTokens); if (css === null) { errors.push(`Unknown named color: ${value}`); return '' }; return `  ${property}: ${css};` }).filter(Boolean).join('\n')
      const ringBacked = BORDER_TARGET_CATALOG.some((target) => target.ringBacked && target.selectors.includes(selector)) && Object.keys(projectedProperties).some((property) => physicalBorderProperties.has(property))
      const projectedSelector = ringBacked ? `${selector}:not(:focus):not(:focus-within):not(:focus-visible)` : selector
      const projectedDeclarations = ringBacked ? `${declarations}\n  --tw-ring-shadow: 0 0 #0000;` : declarations
      return `${prefix}${projectedSelector} {\n${projectedDeclarations}\n}`
    }).filter(Boolean).join('\n')
  }
  const light = ordered.filter((override) => Object.keys(override.properties).length).map((override) => render(override, override.properties, ':where(html:not(.dark)) ')).join('\n')
  const dark = ordered.flatMap((override) => {
    const properties = { ...override.properties, ...(override.darkProperties ?? {}) }
    return Object.keys(properties).length ? [render(override, properties, ':where(html.dark) ')] : []
  }).join('\n')
  return [light, dark].filter(Boolean).join('\n')
}
