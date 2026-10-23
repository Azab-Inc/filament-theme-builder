import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV5 } from '@/models/theme.model'
import type { PaddingCssProjection, PaddingCssRule } from '@/models/padding-projection.model'
import type { PaddingResolutionRequest } from '@/models/padding.model'
import { resolvePadding } from '@/utils/padding-resolver'

const EDGES = ['top', 'right', 'bottom', 'left'] as const

export function projectPadding(state: ThemeStateV5, registry: FilamentRegistry): PaddingCssProjection {
  const rules: PaddingCssRule[] = []
  for (const target of registry.entries.flatMap((entry) => entry.paddingTargets ?? [])) {
    if (target.status !== 'supported' || target.selectors.length === 0) continue
    addRules(rules, state, registry, target.id, target.selectors, {})
    for (const variantId of target.variants) addRules(rules, state, registry, target.id, target.variantSelectors[variantId] ?? [], { variantId })
    for (const stateId of target.states) addRules(rules, state, registry, target.id, target.stateSelectors[stateId] ?? [], { stateId })
    for (const variantId of target.variants) for (const stateId of target.states) {
      addRules(rules, state, registry, target.id, target.stateSelectors[stateId] ?? [], { variantId, stateId })
    }
  }
  return { schemaVersion: 1, rules }
}

function addRules(rules: PaddingCssRule[], state: ThemeStateV5, registry: FilamentRegistry, targetId: string, selectors: readonly string[], context: Omit<PaddingResolutionRequest, 'targetId'>): void {
  if (!selectors.length) return
  const resolved = resolvePadding(state, registry, { targetId, ...context })
  const declarations = Object.fromEntries(EDGES.flatMap((edge) => resolved.edges[edge].native ? [] : [[edge, resolved.edges[edge].value!]]))
  if (!Object.keys(declarations).length) return
  for (const selector of selectors) rules.push({ targetId, selector, declarations, ...context })
}
