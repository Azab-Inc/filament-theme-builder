import type { RawVisualProperty } from '@/models/raw-overrides.model'
import { resolveTrustedColorReference } from '@/registry/tailwind-color-catalog'
import { isSafePropertyValue } from '@/utils/raw-override-property-validation'

export type ColorFieldProfile = 'primary' | 'palette' | 'foundation' | 'raw'

export function isColorFieldValueValid(value: unknown, profile: ColorFieldProfile, property?: RawVisualProperty): value is string {
  if (typeof value !== 'string') return false
  if (profile === 'primary') return /^#[\da-f]{6}$/i.test(value)
  if (profile === 'palette') return /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value)
  if (profile === 'foundation') return /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value) || resolveTrustedColorReference(value) !== null
  return property !== undefined && ['color', 'background-color', 'border-color'].includes(property) && isSafePropertyValue(property, value)
}
