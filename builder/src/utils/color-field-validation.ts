import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ColorFieldProfile } from '@/models/color-field.model'
import { resolveTrustedColorReference } from '@/registry/tailwind-color-catalog'
import { isSafePropertyValue } from '@/utils/raw-override-property-validation'
import { parseUserTokenReference } from '@/utils/user-token-validation'
import { isBuiltinPaletteReference } from '@/utils/color-reference-options'

export function isColorFieldValueValid(value: unknown, profile: ColorFieldProfile, property?: RawVisualProperty): value is string {
  if (typeof value !== 'string') return false
  const referencesCompatible = profile === 'foundation' || profile === 'hex6' || (profile === 'raw' && ['color', 'background-color', 'border-color'].includes(property ?? ''))
  if (referencesCompatible && (isBuiltinPaletteReference(value) || parseUserTokenReference(value))) return true
  if (profile === 'hex6') return /^#[\da-f]{6}$/i.test(value)
  if (profile === 'hex68') return /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)
  if (profile === 'foundation') return /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value) || resolveTrustedColorReference(value) !== null
  return property !== undefined && ['color', 'background-color', 'border-color'].includes(property) && isSafePropertyValue(property, value)
}
