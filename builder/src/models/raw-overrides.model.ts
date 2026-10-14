export const ALL_RAW_VISUAL_PROPERTIES = [
  'color',
  'background-color',
  'border-color',
  'border-width',
  'border-radius',
  'box-shadow',
  'opacity',
  'padding',
  'margin',
  'font-family',
  'font-size',
  'font-weight',
  'line-height',
  'letter-spacing',
  'text-decoration',
  'border-style',
  'text-align',
  'white-space',
] as const

export type RawVisualProperty = typeof ALL_RAW_VISUAL_PROPERTIES[number]

export type RawElementOverride = {
  selector: string
  properties: Partial<Record<RawVisualProperty, string>>
}

export type RawSelectorQuality = 'stable' | 'fragile' | 'unavailable'

export type RawSelectorProposal = {
  selector: string | null
  quality: RawSelectorQuality
  warning?: string
}
