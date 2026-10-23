import type { PaddingEdge, PaddingTargetKind } from '@/models/padding-registry.model'

export type { PaddingEdge }
export type PaddingEdges = Partial<Record<PaddingEdge, string | 0>>
export type PaddingScope = 'global' | 'section' | 'component' | 'variant' | 'state'
export type PaddingContext =
  | { scope: 'global' }
  | { scope: 'section'; sectionId: string }
  | { scope: 'component'; targetId: string }
  | { scope: 'variant'; targetId: string; variantId: string }
  | { scope: 'state'; targetId: string; variantId?: string; stateId: string }
export type PaddingRecord = PaddingContext & { edges: PaddingEdges }
export type ResolvedPaddingEdge = { edge: PaddingEdge; value: string | null; source: PaddingScope | 'native'; sourceTargetId?: string; sourceContext?: PaddingContext; explicit: boolean; native: boolean }
export type ResolvedPadding = { targetId: string; edges: Record<PaddingEdge, ResolvedPaddingEdge> }
export type PaddingResolutionRequest = { targetId: string; variantId?: string; stateId?: string }
export type PaddingReadRequest = PaddingResolutionRequest & { selectedContext: PaddingContext }
export type PaddingReadResult = { resolved: ResolvedPadding; selectedContext: PaddingContext; explicitEdges: PaddingEdge[] }
export type PaddingMutation = { context: PaddingContext; operation: 'set' | 'reset'; edges?: PaddingEdges; resetEdges?: PaddingEdge[] }
export type PaddingValidationResult = { valid: true } | { valid: false; code: string; path: string; message: string }
export type PaddingTarget = { id: string; sectionId: string; targetKind: PaddingTargetKind; status: string; units: readonly string[]; variants: readonly string[]; states: readonly string[] }
