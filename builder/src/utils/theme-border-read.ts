import type { ThemeStateCurrent } from '@/models/theme.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { BORDER_TARGET_CATALOG, borderTargetMetadata } from '@/registry/border-target-catalog'
import { resolveBorderEdge } from '@/utils/border-edge-resolver'

type BorderRead = { targetId: string; edge: string; property: string; scope: string; effectiveValues: { light: unknown; dark: unknown }; provenance: string; explicit: { light: boolean; dark: boolean } }
const edges = ['top', 'right', 'bottom', 'left'] as const
const properties = ['width', 'color', 'style'] as const
const rawPattern = /^border-(top|right|bottom|left)-(width|color|style)$/

export function readThemeBorders(theme: ThemeStateCurrent): BorderRead[] {
  const registry = createThemeRegistry()
  const result: BorderRead[] = []
  const contextMap = new Map<string, ThemeStateCurrent['borderEdges'][number]>(BORDER_TARGET_CATALOG.map((target) => [contextKey({ targetId: target.targetId, scope: 'global' } as ThemeStateCurrent['borderEdges'][number]), { targetId: target.targetId, scope: 'global' } as ThemeStateCurrent['borderEdges'][number]]))
  for (const edge of theme.borderEdges) contextMap.set(contextKey(edge), edge)
  const contexts = [...contextMap.values()]
  for (const context of contexts) {
    const metadata = borderTargetMetadata(context.targetId)
    if (!metadata) continue
    const request = { targetId: context.targetId, ...(context.componentId ? { componentId: context.componentId } : {}), ...(context.variantId ? { variantId: context.variantId } : {}), ...(context.stateId ? { stateId: context.stateId } : {}) }
    for (const edge of edges) for (const property of properties) {
      const resolvedLight = resolveBorderEdge(theme, registry, { ...request, mode: 'light' }, edge, property)
      const resolvedDark = resolveBorderEdge(theme, registry, { ...request, mode: 'dark' }, edge, property)
      result.push({ targetId: context.targetId, edge, property, scope: context.scope, effectiveValues: { light: resolvedLight.value ?? metadata.fallback[edge][property], dark: resolvedDark.value ?? (metadata.darkFallback ?? metadata.fallback)[edge][property] }, provenance: resolvedLight.source === 'native' ? resolvedDark.source : resolvedLight.source, explicit: { light: resolvedLight.explicit, dark: resolvedDark.explicit } })
    }
  }
  for (const override of theme.rawOverrides) for (const property of new Set([...Object.keys(override.properties), ...Object.keys(override.darkProperties ?? {})])) {
    const match = rawPattern.exec(property)
    if (!match) continue
    const rawProperty = property as RawVisualProperty
    const light = override.properties[rawProperty] ?? null
    const dark = override.darkProperties?.[rawProperty] ?? light
    result.push({ targetId: override.selector, edge: match[1]!, property: match[2]!, scope: 'raw', effectiveValues: { light, dark }, provenance: 'raw', explicit: { light: override.properties[rawProperty] !== undefined, dark: override.darkProperties?.[rawProperty] !== undefined } })
  }
  return result
}

function contextKey(edge: ThemeStateCurrent['borderEdges'][number]): string { return [edge.targetId, edge.scope, edge.componentId ?? '', edge.variantId ?? '', edge.stateId ?? ''].join('\u0000') }
