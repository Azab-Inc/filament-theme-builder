import type { Density } from '@/models/foundations.model'
import type { FoundationEventChange } from '@/models/foundation-event-change.model'
import type { FoundationFontChange } from '@/models/foundation-font-change.model'

export type FoundationsTypographyLayoutControlsEmits = {
  'set-font-choice': [change: FoundationFontChange]
  'set-font-name': [change: FoundationFontChange]
  'set-density': [density: Density]
  'set-number-foundation': [change: FoundationEventChange]
  'set-select-foundation': [change: FoundationEventChange]
  reset: [path: string]
}
