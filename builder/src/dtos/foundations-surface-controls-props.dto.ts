import type {
  FoundationBorderName,
  FoundationSurfaceName,
  FoundationTextName,
  ResolvedFoundation,
  ThemeMode,
} from '@/models/foundations.model'

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
  contextKey?: string
}
