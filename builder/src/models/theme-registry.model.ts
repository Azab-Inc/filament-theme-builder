import type { ThemeValue } from '@/models/theme.model'

export type RegistryValueType = 'color' | 'string' | 'number' | 'boolean'

export const SUPPORTED_PSEUDO_STATES = ['hover', 'focus'] as const

export type RegistryControlConstraints = {
  pattern?: RegExp | { source: string; flags: string }
  min?: number
  max?: number
}

export type RegistryControl = {
  id: string
  valueType: RegistryValueType
  constraints?: RegistryControlConstraints
  defaultValue?: ThemeValue
  globalValue?: 'primary'
}

export type RegistryEntry = {
  id: string
  label: string
  family: string
  selectors: readonly string[]
  controls: readonly RegistryControl[]
  variants: readonly string[]
  states: readonly string[]
  filamentCompatibility: string
}

export type FilamentRegistry = {
  entries: readonly RegistryEntry[]
}

export type RegistryLookupEvidence = {
  selectors: string[]
  filamentVersion: string
}

export type RegistryLookupResult =
  | { status: 'matched'; entry: RegistryEntry }
  | { status: 'no-match' }
  | { status: 'ambiguous'; candidateIds: string[] }
  | { status: 'incompatible'; required: string }
