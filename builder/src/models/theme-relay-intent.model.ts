import type { ThemeMode } from '@/models/foundations.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import type { ThemeValue, ThemeStateCurrent } from '@/models/theme.model'

export type ThemeRelayIntent = {
  schemaVersion: 1
  kind: 'theme-intent'
  action: 'set' | 'reset' | 'link' | 'unlink' | 'create-color' | 'create-palette' | 'update' | 'remove'
  target: ModeLinkTarget | { kind: 'user-color' | 'user-palette'; name: string; shade?: import('@/models/foundations.model').PaletteShade }
  mode?: ThemeMode
  value?: ThemeValue
}

export type ThemeRelayIntentState = ThemeStateCurrent
