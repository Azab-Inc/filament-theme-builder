import type { PaddingEdge } from '@/models/padding.model'

export type PaddingCssDeclarations = Partial<Record<PaddingEdge, string>>
export type PaddingCssRule = {
  targetId: string
  selector: string
  declarations: PaddingCssDeclarations
  variantId?: string
  stateId?: string
}
export type PaddingCssProjection = {
  schemaVersion: 1
  rules: readonly PaddingCssRule[]
}
