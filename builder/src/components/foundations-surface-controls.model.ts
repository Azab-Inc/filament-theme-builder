import type { FoundationState, ResolvedFoundation, ThemeMode } from '@/models/foundations.model'

export type FoundationSurfaceName = keyof FoundationState['surfaces']
export type FoundationBorderName = keyof FoundationState['borders']
export type FoundationTextName = keyof FoundationState['text']

export type FoundationModeValueChange = {
  path: string
  event: Event
}

export type FoundationsSurfaceControlsProps = {
  activeMode: ThemeMode
  surfaces: ResolvedFoundation['surfaces']
  borders: ResolvedFoundation['borders']
  text: ResolvedFoundation['text']
  surfaceNames: readonly FoundationSurfaceName[]
  borderNames: readonly FoundationBorderName[]
  textNames: readonly FoundationTextName[]
  statusFor: (path: string) => string
  foundationError: (path: string) => string | undefined
}

export type FoundationsSurfaceControlsEmits = {
  'set-mode': [mode: ThemeMode]
  'set-mode-value': [change: FoundationModeValueChange]
  reset: [path: string]
}
