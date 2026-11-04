import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ModeLinkBinding } from '@/models/mode-link-control.model'

export type ColorFieldProfile = 'hex6' | 'hex68' | 'foundation' | 'raw'

export type ColorFieldProps = {
  modeTarget?: import('@/models/mode-link-target.model').ModeLinkTarget
  id: string
  label: string
  value: string
  effectiveValue: string
  profile: ColorFieldProfile
  contextKey: string
  textLabel?: string
  visibleLabel?: string
  nativeLabel?: string
  nativeId?: string
  statusId?: string
  errorId?: string
  error?: string
  externalError?: boolean
  resetKey?: string | number
  nativePrimary?: boolean
  property?: RawVisualProperty
  userTokenOptions?: readonly string[]
  modeLink?: ModeLinkBinding
}

export type ColorFieldEmits = { input: [event: Event] }
