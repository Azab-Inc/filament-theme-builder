import type { RegistryEntry } from '@/models/theme-registry.model'

export type InspectorResolution =
  | { status: 'editable'; entry: RegistryEntry; editorTarget: string; breadcrumb: string }
  | { status: 'selector-only'; entry: RegistryEntry; breadcrumb: string }
  | { status: 'no-match'; breadcrumb: string }
  | { status: 'ambiguous' | 'incompatible'; breadcrumb: string; candidateIds?: string[]; required?: string }
