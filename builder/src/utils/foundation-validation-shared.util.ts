import type { ValidationError } from '@/models/validation-error.model'
import { isTrustedColor } from '@/registry/tailwind-color-catalog'
import { SAFE_FONT_FAMILY } from '@/utils/foundation-validation-constants.util'

const HEX_COLOR = /^#[\da-f]{6}(?:[\da-f]{2})?$/i

export function invalid(code: ValidationError['code'], path: string, message: string): ValidationError {
  return { valid: false, code, path, message }
}

export function join(prefix: string, suffix: string): string {
  return prefix ? `${prefix}.${suffix}` : suffix
}

export function checkKeys(value: Record<string, unknown>, allowed: readonly string[], required: readonly string[], path: string): ValidationError | undefined {
  const allowedSet = new Set(allowed)
  const unknown = Reflect.ownKeys(value).find((key) => typeof key !== 'string' || !allowedSet.has(key))
  if (unknown !== undefined) return invalid('unknown-key', join(path, String(unknown)), 'Unknown foundation key')
  const missing = required.find((key) => !Object.prototype.hasOwnProperty.call(value, key))
  return missing === undefined ? undefined : invalid('invalid-value', join(path, missing), 'Missing required foundation key')
}

export function isColor(value: unknown): value is string {
  return isHexColor(value) || isTrustedColor(value)
}

export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && HEX_COLOR.test(value)
}

export function isSafeFontName(value: unknown): value is string {
  return typeof value === 'string' && SAFE_FONT_FAMILY.test(value)
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
