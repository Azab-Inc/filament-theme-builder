import type { ThemeStateCurrent } from '@/models/theme.model'
import type { BorderEdge, BorderProperty } from '@/models/border-edge.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { borderTargetMetadata } from '@/registry/border-target-catalog'
import { resolveBorderEdge } from '@/utils/border-edge-resolver'
import { userTokenCssValue } from '@/utils/user-token-css'
import { SUPPORTED_PSEUDO_STATES } from '@/models/theme-registry.model'

const edges: readonly BorderEdge[] = ['top', 'right', 'bottom', 'left']

export type BorderProjectionRule = { targetId: string; selector: string; declarations: Record<string, string> }

export function projectBorderEdges(theme: ThemeStateCurrent, mode: 'light' | 'dark'): BorderProjectionRule[] {
  const registry = createThemeRegistry()
  const targetIds = [...new Set(theme.borderEdges.map((edge) => edge.targetId))]
  return targetIds.flatMap((targetId) => {
    const metadata = borderTargetMetadata(targetId)
    if (!metadata) return []
    const contexts = [...new Map(theme.borderEdges.filter((edge) => edge.targetId === targetId).map((edge) => [contextKey(edge), edge])).values()].sort((left, right) => scopeRank(left.scope) - scopeRank(right.scope))
    return contexts.flatMap((context) => {
      if (!hasModeValue(theme, targetId, context, mode)) return []
      const request = { targetId, mode, ...(context.componentId ? { componentId: context.componentId } : {}), ...(context.variantId ? { variantId: context.variantId } : {}), ...(context.stateId ? { stateId: context.stateId } : {}) }
      const declarations: Record<string, string> = {}
      for (const edge of edges) for (const property of ['width', 'color', 'style'] as const) {
        const value = resolveBorderEdge(theme, registry, request, edge, property).value
        const fallback = mode === 'dark' ? (metadata.darkFallback ?? metadata.fallback) : metadata.fallback
        declarations[`border-${edge}-${property}`] = value === null ? fallback[edge][property] : cssValue(property, value, theme)
      }
      const rules = selectorsForContext(metadata, context).map((selector) => ({ targetId, selector: modeSelector(mode, selector, context.stateId, false), declarations }))
      if (metadata.ringBacked && context.stateId !== 'focus') {
        const ringDeclarations = { '--tw-ring-shadow': '0 0 #0000' }
        rules.push(...selectorsForContext(metadata, context).map((selector) => ({ targetId, selector: modeSelector(mode, selector, context.stateId, true), declarations: ringDeclarations })))
      }
      return rules
    })
  })
}

function scopeRank(scope: string): number { return scope === 'global' ? 0 : scope === 'component' ? 1 : scope === 'variant' ? 2 : 3 }

function selectorsForContext(metadata: NonNullable<ReturnType<typeof borderTargetMetadata>>, context: ThemeStateCurrent['borderEdges'][number]): readonly string[] {
  if (context.scope === 'component') return metadata.componentSelectors?.[context.componentId ?? ''] ?? []
  if (context.scope === 'variant') return metadata.variantSelectors?.[context.variantId ?? ''] ?? []
  if (context.scope === 'state') return metadata.stateSelectors?.[context.stateId ?? ''] ?? []
  return metadata.selectors
}

function contextKey(edge: ThemeStateCurrent['borderEdges'][number]): string {
  return [edge.scope, edge.componentId ?? '', edge.variantId ?? '', edge.stateId ?? ''].join('\u0000')
}

function hasModeValue(theme: ThemeStateCurrent, targetId: string, context: ThemeStateCurrent['borderEdges'][number], mode: 'light' | 'dark'): boolean {
  return theme.borderEdges.some((edge) => edge.targetId === targetId && contextKey(edge) === contextKey(context) && (mode === 'light' ? edge.value !== undefined : edge.value !== undefined || edge.darkValue !== undefined))
}

function cssValue(property: BorderProperty, value: string | number | boolean, theme: ThemeStateCurrent): string {
  if (property === 'width') return `${value}px`
  if (property === 'color') return userTokenCssValue(String(value), theme.foundations.userTokens) ?? String(value)
  return String(value)
}

function modeSelector(mode: 'light' | 'dark', selector: string, stateId?: string, suppressFocus = false): string {
  const state = stateId && stateId !== 'default' && SUPPORTED_PSEUDO_STATES.includes(stateId as never) ? `:${stateId}` : ''
  const focusSuppression = suppressFocus ? ':not(:focus):not(:focus-within):not(:focus-visible)' : ''
  return stateId === 'focus' ? `:where(html${mode === 'dark' ? '.dark' : ':not(.dark)'}) ${selector}:focus-within` : `:where(html${mode === 'dark' ? '.dark' : ':not(.dark)'}) ${selector}${state}${focusSuppression}`
}
