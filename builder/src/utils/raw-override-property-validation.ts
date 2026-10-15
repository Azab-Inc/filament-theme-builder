import type { RawVisualProperty } from '@/models/raw-overrides.model'

const colorPattern = /^(?:#[\da-f]{3,8}|(?:rgb|hsl|hwb|lab|lch|oklab|oklch)a?\([^;{}()]+\)|transparent|var\(--(?:color-)?(?:primary|success|warning|danger|info|gray)(?:-(?:50|100|200|300|400|500|600|700|800|900|950))?\))$/i
const lengthToken = '(?:0|(?:0|[1-9]\\d{0,3})(?:\\.\\d+)?(?:px|rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|%)?)'
const lengthPattern = new RegExp(`^${lengthToken}$`, 'i')
const spacingPattern = new RegExp(`^${lengthToken}(?:\\s+${lengthToken}){0,3}$`, 'i')
const shadowLength = '(?:0|-?\\d+(?:\\.\\d+)?(?:px|rem|em))'
const shadowPattern = new RegExp(`^(?:none|(?:inset\\s+)?${shadowLength}(?:\\s+${shadowLength}){1,3}(?:\\s+(?:#[\\da-f]{3,8}|rgba?\\([^;{}()]+\\)|transparent))?)$`, 'i')
const familyPattern = /^(?:[A-Za-z][A-Za-z0-9 _.-]{0,63})(?:\s*,\s*(?:[A-Za-z][A-Za-z0-9 _.-]{0,63}))*$/
const unsafeValuePattern = /[;{}<>]|\/\*|\*\/|url\s*\(|@(?:import|supports|media|layer|font-face)|expression\s*\(|javascript\s*:/i

export function isSafePropertyValue(property: RawVisualProperty, value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 300 || unsafeValuePattern.test(value)) return false
  switch (property) {
    case 'color':
    case 'background-color':
    case 'border-color':
      return colorPattern.test(value)
    case 'border-width':
    case 'border-radius':
    case 'font-size':
    case 'letter-spacing':
      return lengthPattern.test(value)
    case 'padding':
    case 'margin':
      return spacingPattern.test(value)
    case 'box-shadow':
      return shadowPattern.test(value.trim())
    case 'opacity': {
      const numeric = Number(value)
      return Number.isFinite(numeric) && numeric >= 0 && numeric <= 1 && /^\d+(?:\.\d+)?$/.test(value)
    }
    case 'font-family':
      return familyPattern.test(value)
    case 'font-weight':
      return /^(?:normal|bold|(?:100|200|300|400|500|600|700|800|900))$/.test(value)
    case 'line-height':
      return /^(?:normal|(?:0|\d+(?:\.\d+)?)(?:px|rem|em|%)?)$/.test(value)
    case 'text-decoration':
      return /^(?:none|underline|overline|line-through)$/.test(value)
    case 'border-style':
      return /^(?:none|solid|dashed|dotted|double)$/.test(value)
    case 'text-align':
      return /^(?:left|right|center|justify|start|end)$/.test(value)
    case 'white-space':
      return /^(?:normal|nowrap|pre|pre-wrap|pre-line|break-spaces)$/.test(value)
  }
}
