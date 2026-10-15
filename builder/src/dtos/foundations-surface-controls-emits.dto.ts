import type { FoundationModeValueChange } from '@/dtos/foundation-mode-value-change.dto'
import type { ThemeMode } from '@/models/foundations.model'

export type FoundationsSurfaceControlsEmits = {
  'set-mode': [mode: ThemeMode]
  'set-mode-value': [change: FoundationModeValueChange]
  reset: [path: string]
}
