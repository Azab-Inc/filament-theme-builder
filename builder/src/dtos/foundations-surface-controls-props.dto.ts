import type {
  FoundationBorderName,
  FoundationSurfaceName,
  FoundationTextName,
  ResolvedFoundation,
  ThemeMode,
} from '@/models/foundations.model'
import type { ModeLinkBinding } from '@/models/mode-link-control.model'

export type FoundationsSurfaceControlsProps = {
  activeMode: ThemeMode
  surfaces: ResolvedFoundation['surfaces']
  borders: ResolvedFoundation['borders']
  text: ResolvedFoundation['text']
  effectiveFoundation?: Pick<ResolvedFoundation, 'surfaces' | 'borders' | 'text'>
  surfaceNames: readonly FoundationSurfaceName[]
  borderNames: readonly FoundationBorderName[]
  textNames: readonly FoundationTextName[]
  statusFor: (path: string) => string
  foundationError: (path: string) => string | undefined
  contextKey?: string
  userTokenOptions?: readonly string[]
  modeLinkFor?: (path: string, value: string) => ModeLinkBinding
}
