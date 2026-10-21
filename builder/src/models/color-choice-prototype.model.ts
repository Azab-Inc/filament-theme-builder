import type {
  FoundationStateV4,
  PaletteName,
  PaletteShade,
  ThemeMode,
} from '@/models/foundations.model'

export type ColorChoicePrototypeHost = 'A' | 'B' | 'C'
export type ColorChoicePrototypeSection = 'Foundations' | 'Components'
export type ColorChoicePrototypeScope = 'global' | 'component' | 'variant' | 'state'
export type ColorChoicePrototypeMeta = {
  token: string | null
  source: 'Custom' | 'Tailwind' | 'Default'
  originalValue?: string
}
export type ColorChoicePrototypeTarget = {
  path: string
  label: string
  value: string
  resetValue: string
  group: 'palette' | 'surface' | 'border' | 'text' | 'component'
  key: string
  stop?: PaletteShade | 'base'
  mode?: ThemeMode
}
export type ColorChoicePrototypeState = {
  theme: FoundationStateV4
  defaults: FoundationStateV4
  mode: { value: ThemeMode }
  section: { value: ColorChoicePrototypeSection }
  scope: { value: ColorChoicePrototypeScope }
  openPalette: { value: PaletteName | null }
  activePath: { value: string | null }
  anchor: { value: { left: number; top: number } }
  search: { value: string }
  tab: { value: 'Custom' | 'Tailwind' }
  draft: { value: string }
  changed: { value: Set<string> }
  componentBackgrounds: Record<ColorChoicePrototypeScope, string>
  meta: Map<string, ColorChoicePrototypeMeta>
  changedCount: { value: number }
  palettes: readonly PaletteName[]
  shades: readonly PaletteShade[]
  target: (
    path: string,
    label: string,
    value: string,
    resetValue: string,
    group: ColorChoicePrototypeTarget['group'],
    key: string,
    stop?: PaletteShade | 'base',
    mode?: ThemeMode,
  ) => ColorChoicePrototypeTarget
  getValue: (target: ColorChoicePrototypeTarget) => string
  getMeta: (path: string) => ColorChoicePrototypeMeta
  open: (target: ColorChoicePrototypeTarget, point?: { left: number; top: number }) => void
  close: () => void
  apply: (
    target: ColorChoicePrototypeTarget,
    value: string,
    token?: string | null,
    originalValue?: string,
  ) => boolean
  reset: (target: ColorChoicePrototypeTarget) => void
}
