import type { FoundationFontChoiceOption } from '@/models/foundation-font-choice-option.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type {
  ParsedLength,
  ParsedSpacing,
  RawPropertyControl,
  RawPropertyOption,
} from '@/models/raw-property-control.model'

const lengthToken = /^(-?\d*\.?\d+)\s*(px|rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|%)?$/i
const numericAmount = /^\d*\.?\d+$/

const weightOptions: readonly RawPropertyOption[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'bold', label: 'Bold' },
  ...['100', '200', '300', '400', '500', '600', '700', '800', '900'].map((weight) => ({ value: weight, label: weight })),
]

const shadowOptions: readonly RawPropertyOption[] = [
  { value: 'none', label: 'None' },
  { value: '0 1px 2px rgb(0 0 0 / 0.05)', label: 'Subtle' },
  { value: '0 1px 3px rgb(0 0 0 / 0.1)', label: 'Soft' },
  { value: '0 4px 6px rgb(0 0 0 / 0.1)', label: 'Medium' },
  { value: '0 10px 15px rgb(0 0 0 / 0.1)', label: 'Large' },
]

const specs: Record<RawVisualProperty, RawPropertyControl> = {
  color: { kind: 'color' },
  'background-color': { kind: 'color' },
  'border-color': { kind: 'color' },
  'border-width': { kind: 'length', units: ['px', 'rem', 'em'], step: 0.5, max: 8 },
  'border-top-color': { kind: 'color' },
  'border-right-color': { kind: 'color' },
  'border-bottom-color': { kind: 'color' },
  'border-left-color': { kind: 'color' },
  'border-top-width': { kind: 'length', units: ['px', 'rem', 'em'], step: 0.5, max: 8 },
  'border-right-width': { kind: 'length', units: ['px', 'rem', 'em'], step: 0.5, max: 8 },
  'border-bottom-width': { kind: 'length', units: ['px', 'rem', 'em'], step: 0.5, max: 8 },
  'border-left-width': { kind: 'length', units: ['px', 'rem', 'em'], step: 0.5, max: 8 },
  'border-radius': { kind: 'length', units: ['px', 'rem', 'em', '%'], step: 0.05 },
  'box-shadow': { kind: 'shadow', options: shadowOptions },
  opacity: { kind: 'number', min: 0, max: 1, step: 0.05 },
  padding: { kind: 'spacing', units: ['px', 'rem', 'em', '%'], step: 0.05 },
  margin: { kind: 'spacing', units: ['px', 'rem', 'em', '%'], step: 0.05 },
  'font-family': { kind: 'font-family' },
  'font-size': { kind: 'length', units: ['px', 'rem', 'em', '%'], step: 0.05 },
  'font-weight': { kind: 'select', options: weightOptions },
  'line-height': { kind: 'length', units: ['', 'px', 'rem', 'em', '%'], step: 0.05 },
  'letter-spacing': { kind: 'length', units: ['px', 'rem', 'em'], step: 0.05 },
  'text-decoration': { kind: 'select', options: [
    { value: 'none', label: 'None' }, { value: 'underline', label: 'Underline' },
    { value: 'overline', label: 'Overline' }, { value: 'line-through', label: 'Line through' },
  ] },
  'border-style': { kind: 'select', options: [
    { value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' },
    { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' },
    { value: 'double', label: 'Double' },
  ] },
  'border-top-style': { kind: 'select', options: [{ value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'double', label: 'Double' }] },
  'border-right-style': { kind: 'select', options: [{ value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'double', label: 'Double' }] },
  'border-bottom-style': { kind: 'select', options: [{ value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'double', label: 'Double' }] },
  'border-left-style': { kind: 'select', options: [{ value: 'none', label: 'None' }, { value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }, { value: 'double', label: 'Double' }] },
  'text-align': { kind: 'select', options: [
    { value: 'left', label: 'Left' }, { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' }, { value: 'justify', label: 'Justify' },
    { value: 'start', label: 'Start' }, { value: 'end', label: 'End' },
  ] },
  'white-space': { kind: 'select', options: [
    { value: 'normal', label: 'Normal' }, { value: 'nowrap', label: 'No wrap' },
    { value: 'pre', label: 'Pre' }, { value: 'pre-wrap', label: 'Pre wrap' },
    { value: 'pre-line', label: 'Pre line' }, { value: 'break-spaces', label: 'Break spaces' },
  ] },
}

export function rawPropertyControl(property: RawVisualProperty): RawPropertyControl {
  return specs[property]
}

export function splitLengthValue(value: string, units: readonly string[]): ParsedLength {
  const fallbackUnit = units[0] ?? ''
  const match = value.trim().match(lengthToken)
  if (!match) return { amount: '', unit: fallbackUnit }
  const parsedUnit = match[2]?.toLowerCase() ?? fallbackUnit
  return { amount: match[1] ?? '', unit: units.includes(parsedUnit) ? parsedUnit : fallbackUnit }
}

export function joinLengthValue(amount: string, unit: string): string {
  return amount === '' ? '' : `${amount}${unit}`
}

export function parseSpacingValue(value: string): ParsedSpacing {
  const parsed = value.trim().split(/\s+/).filter(Boolean).map((token) => token.match(lengthToken))
  const amounts = parsed.flatMap((match) => (match ? [match[1] ?? ''] : []))
  if (amounts.length === 0) return { amounts: ['', '', '', ''], unit: 'px' }
  const [first = '', second = '', third = ''] = amounts
  const unit = parsed.find((match) => match?.[2])?.[2]?.toLowerCase() ?? 'px'
  if (amounts.length === 1) return { amounts: [first, first, first, first], unit }
  if (amounts.length === 2) return { amounts: [first, second, first, second], unit }
  if (amounts.length === 3) return { amounts: [first, second, third, second], unit }
  return { amounts: [first, second, third, amounts[3] ?? ''], unit }
}

export function composeSpacingValue(amounts: readonly string[], unit: string): string {
  if (amounts.length !== 4 || !amounts.every((amount) => numericAmount.test(amount))) return ''
  return amounts.map((amount) => `${amount}${unit}`).join(' ')
}

export function fontFamilyOptions(fontChoices: ReadonlyArray<FoundationFontChoiceOption>): readonly RawPropertyOption[] {
  return fontChoices.flatMap((choice) => choice.font
    ? [{ value: choice.font.family, label: choice.label }]
    : [])
}
