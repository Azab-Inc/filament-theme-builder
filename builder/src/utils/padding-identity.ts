import type { PaddingContext, PaddingRecord } from '@/models/padding.model'

export function paddingContextIdentity(context: PaddingContext): string {
  if (context.scope === 'global') return 'global'
  if (context.scope === 'section') return `section\0${context.sectionId}`
  if (context.scope === 'component') return `component\0${context.targetId}`
  if (context.scope === 'variant') return `variant\0${context.targetId}\0${context.variantId}`
  return `state\0${context.targetId}\0${context.variantId ?? ''}\0${context.stateId}`
}

export function paddingRecordContext(record: PaddingRecord): PaddingContext {
  const { edges: _edges, ...context } = record
  return context
}

export function samePaddingContext(left: PaddingContext, right: PaddingContext): boolean {
  return paddingContextIdentity(left) === paddingContextIdentity(right)
}
