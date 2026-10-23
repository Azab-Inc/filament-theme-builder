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
  return validOverrides.sort((left, right) => left.selector.localeCompare(right.selector)).map((override) => {
    const declarations = Object.entries(override.properties).sort(([left], [right]) => left.localeCompare(right))
      .map(([property, value]) => `  ${property}: ${value};`).join('\n')
    return `${override.selector} {\n${declarations}\n}`
  }).join('\n')
}
