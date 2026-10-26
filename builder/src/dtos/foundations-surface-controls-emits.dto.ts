import type { FoundationModeValueChange } from '@/dtos/foundation-mode-value-change.dto'

export type FoundationsSurfaceControlsEmits = {
  'set-mode-value': [change: FoundationModeValueChange]
  reset: [path: string]
}
