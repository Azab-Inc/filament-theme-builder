import type { ThemeMode } from '@/models/foundations.model'
import type { BorderEdgeOverride } from '@/models/border-edge.model'
import type { ThemeStoreContext } from '@/models/theme-store.model'
import { borderEdgeIdentity, validateBorderEdge } from '@/utils/border-edge-validation'

export type BorderEdgeAction = BorderEdgeOverride & { mode?: ThemeMode }

export function useThemeBorderActions({ theme, registry, commit = (candidate) => { theme.value = candidate } }: ThemeStoreContext) {
  function setBorderEdge(input: BorderEdgeAction): void {
    setBorderEdges([input])
  }

  function setBorderEdges(inputs: BorderEdgeAction[]): void {
    if (inputs.length === 0) return
    const candidateInputs = inputs.map((input) => structuredClone(input))
    if (candidateInputs.some((candidate) => !applyBorderCandidate(candidate, registry))) return
    let next = theme.value.borderEdges
    for (const candidate of candidateInputs) next = upsertBorderCandidate(candidate, next)
    commit({ ...theme.value, borderEdges: next })
  }

  function applyBorderCandidate(candidate: BorderEdgeAction, registry: ThemeStoreContext['registry']): boolean {
    const mode = candidate.mode ?? 'light'
    const { mode: _ignored, ...override } = candidate
    return (mode === 'light' || mode === 'dark') && validateBorderEdge(override, registry).valid && override.value !== undefined
  }

  function upsertBorderCandidate(candidate: BorderEdgeAction, existingEdges: BorderEdgeOverride[]): BorderEdgeOverride[] {
    const mode = candidate.mode ?? 'light'
    const { mode: _ignored, ...override } = candidate
    const identity = borderEdgeIdentity(override)
    const existing = existingEdges.find((item) => borderEdgeIdentity(item) === identity)
    const next = existingEdges.filter((item) => borderEdgeIdentity(item) !== identity)
    const merged = { ...(existing ?? {}), ...override }
    if (mode === 'dark') {
      merged.darkValue = override.value
      if (existing?.value !== undefined) merged.value = existing.value
      else delete merged.value
    } else {
      merged.value = override.value
      if (existing?.darkValue !== undefined) merged.darkValue = existing.darkValue
      else delete merged.darkValue
    }
    next.push(merged)
    return next
  }

  function resetBorderEdge(input: Omit<BorderEdgeAction, 'value' | 'darkValue'>): void {
    resetBorderEdges([input])
  }

  function resetBorderEdges(inputs: Omit<BorderEdgeAction, 'value' | 'darkValue'>[]): void {
    if (inputs.length === 0) return
    const identities = new Set(inputs.map((input) => borderEdgeIdentity(input)))
    const modes = new Map(inputs.map((input) => [borderEdgeIdentity(input), input.mode ?? 'light']))
    const next = theme.value.borderEdges.flatMap((item) => {
      if (!identities.has(borderEdgeIdentity(item))) return [item]
      const remaining = { ...item }
      if (modes.get(borderEdgeIdentity(item)) === 'dark') delete remaining.darkValue
      else delete remaining.value
      return remaining.value === undefined && remaining.darkValue === undefined ? [] : [remaining]
    })
    if (JSON.stringify(next) !== JSON.stringify(theme.value.borderEdges)) commit({ ...theme.value, borderEdges: next })
  }

  return { setBorderEdge, setBorderEdges, resetBorderEdge, resetBorderEdges }
}
