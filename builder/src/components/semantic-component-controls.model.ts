import type { ResolveRequest, ThemeScope } from '@/models/theme.model'

export type SemanticComponentTarget = {
  targetId: string
  controlId: string
  componentId: string
  variantId: string
  stateId: string
}

export type SemanticComponentScope = {
  scope: ThemeScope
  label: string
}

export type SemanticComponentRow = SemanticComponentScope & {
  request: ResolveRequest
  value: string
  source: string
  explicit: boolean
}

export type SemanticComponentControlsProps = {
  rows: ReadonlyArray<SemanticComponentRow>
}
