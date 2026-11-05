import type { ThemeStateInput } from '@/models/theme.model'
import { validateRawElementOverride } from '@/utils/raw-override-validation'

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
  const ordered = validOverrides.sort((left, right) => left.selector.localeCompare(right.selector))
  const render = (override: typeof ordered[number], properties: Record<string, string>, prefix = '') => {
    const declarations = Object.entries(properties).sort(([left], [right]) => left.localeCompare(right))
      .map(([property, value]) => `  ${property}: ${value};`).join('\n')
    return `${prefix}${override.selector} {\n${declarations}\n}`
  }
  const light = ordered.filter((override) => Object.keys(override.properties).length).map((override) => render(override, override.properties, ':where(html:not(.dark)) ')).join('\n')
  const dark = ordered.flatMap((override) => {
    const properties = { ...override.properties, ...(override.darkProperties ?? {}) }
    return Object.keys(properties).length ? [render(override, properties, ':where(html.dark) ')] : []
  }).join('\n')
  return [light, dark].filter(Boolean).join('\n')
}
