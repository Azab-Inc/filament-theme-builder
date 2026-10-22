export type PaddingTargetKind = 'leaf' | 'container'
export type PaddingTargetStatus = 'supported' | 'unmapped' | 'excluded'
export type PaddingUnit = 'px' | 'rem' | 'em' | '%' | 'vh' | 'vw'
export type PaddingEdge = 'top' | 'right' | 'bottom' | 'left'

export type PaddingEvidence = {
  selector: string
  source: string
  sampleCount: number
  verified: boolean
  values?: Partial<Record<PaddingEdge, string>>
  reason?: string
}

export type RegistryPaddingTarget = {
  id: string
  entryId: string
  selectors: readonly string[]
  targetKind: PaddingTargetKind
  status: PaddingTargetStatus
  units: readonly PaddingUnit[]
  variants: readonly string[]
  states: readonly string[]
  evidence: readonly PaddingEvidence[]
}

export type PaddingTargetCatalog = {
  version: 1
  compatibility: '5.9.0'
  targets: readonly RegistryPaddingTarget[]
}
