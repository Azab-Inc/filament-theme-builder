import type { RawVisualProperty } from '@/models/raw-overrides.model'

export type ColorFieldProfile = 'hex6' | 'hex68' | 'foundation' | 'raw'

export type ColorFieldProps = {
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
}

export type ColorFieldEmits = { input: [event: Event] }
