export type PaddingTargetKind = 'leaf' | 'container'
export type PaddingTargetStatus = 'supported' | 'unmapped' | 'excluded'
export type PaddingUnit = 'px' | 'rem' | 'em' | 'ex' | 'ch' | 'lh' | 'rlh' | 'vw' | 'vh' | 'vmin' | 'vmax' | '%'
export const PADDING_UNITS: readonly PaddingUnit[] = ['px', 'rem', 'em', 'ex', 'ch', 'lh', 'rlh', 'vw', 'vh', 'vmin', 'vmax', '%']
export type PaddingEdge = 'top' | 'right' | 'bottom' | 'left'

export type PaddingEvidence = {
  selector?: string
  source: string
  sampleCount?: number
  verified: boolean
  values?: Partial<Record<PaddingEdge, string>>
  reason?: string
}

export type RegistryPaddingTarget = {
  id: string
  entryId: string
  sectionId: string
  nestedPolicy: 'leaf-defaults' | 'explicit-only' | 'none'
  order?: number
  selectors: readonly string[]
  targetKind: PaddingTargetKind
  status: PaddingTargetStatus
  units: readonly PaddingUnit[]
  variants: readonly string[]
  states: readonly string[]
  evidence: readonly PaddingEvidence[]
  variantSelectors: Readonly<Record<string, readonly string[]>>
  stateSelectors: Readonly<Record<string, readonly string[]>>
}

export type PaddingTargetCatalog = {
  version: 1
  compatibility: '5.9.0'
  targets: readonly RegistryPaddingTarget[]
}
