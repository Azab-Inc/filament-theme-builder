import { computed, type Ref } from 'vue'
import type { PaddingMutation, PaddingReadResult, PaddingEdges, PaddingContext, PaddingReadRequest } from '@/models/padding.model'
import type { PaddingEdge } from '@/models/padding-registry.model'

type Reader = (request: PaddingReadRequest) => PaddingReadResult
type Target = { id: string }
type SetMutator = (mutation: PaddingMutation & { operation: 'set' }) => void
type ResetMutator = (mutation: PaddingMutation & { operation: 'reset' }) => void

export function usePaddingEditor(target: Ref<Target>, context: Ref<PaddingContext>, read: Reader, set: SetMutator, reset: ResetMutator) {
  const request = computed<PaddingReadRequest>(() => ({ targetId: target.value.id, ...(context.value.scope === 'variant' ? { variantId: context.value.variantId } : {}), ...(context.value.scope === 'state' ? { variantId: context.value.variantId, stateId: context.value.stateId } : {}), selectedContext: context.value }))
  const result = computed(() => read(request.value))
  const edges = computed(() => Object.fromEntries(Object.entries(result.value.resolved.edges).map(([edge, value]) => [edge, value.value])) as Record<PaddingEdge, string | null>)
  const sources = computed(() => Object.fromEntries(Object.entries(result.value.resolved.edges).map(([edge, value]) => [edge, value.source])) as Record<PaddingEdge, string>)
  function setEdges(edges: PaddingEdges): void { set({ operation: 'set', context: context.value, edges }) }
  function resetEdges(edges: PaddingEdge[] = result.value.explicitEdges): void { if (edges.length) reset({ operation: 'reset', context: context.value, resetEdges: edges }) }
  return { context, edges, sources, explicitEdges: computed(() => result.value.explicitEdges), setEdges, resetEdges }
}
