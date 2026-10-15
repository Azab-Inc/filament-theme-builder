import type { PaletteName } from '@/models/foundations.model'
import type { PaletteBaseChange } from './palette-base-change.model'
import type { PaletteShadeChange } from './palette-shade-change.model'
import type { PaletteShadeReset } from './palette-shade-reset.model'

export type FoundationsPaletteControlsEmits = {
  'set-palette-base': [change: PaletteBaseChange]
  'set-palette-shade': [change: PaletteShadeChange]
  'reset-palette-base': [name: PaletteName]
  'reset-palette-shade': [reset: PaletteShadeReset]
}
