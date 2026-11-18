import type { ThemeMode } from '@/models/foundations.model'
import type { ThemeScope, ThemeValue } from '@/models/theme.model'

export const BORDER_EDGES = ['top', 'right', 'bottom', 'left'] as const
export type BorderEdge = typeof BORDER_EDGES[number]
export const BORDER_PROPERTIES = ['width', 'color', 'style'] as const
export type BorderProperty = typeof BORDER_PROPERTIES[number]
export const BORDER_STYLES = ['none', 'solid', 'dashed', 'dotted', 'double'] as const
export type BorderStyle = typeof BORDER_STYLES[number]
export type BorderEdgeOverride = {
  targetId: string; controlId: 'border'; edge: BorderEdge; property: BorderProperty; scope: ThemeScope
  componentId?: string; variantId?: string; stateId?: string; value?: ThemeValue; darkValue?: ThemeValue
}
export type BorderResolveRequest = { targetId: string; componentId?: string; variantId?: string; stateId?: string; mode?: ThemeMode }
export type ResolvedBorderEdge = { edge: BorderEdge; property: BorderProperty; value: ThemeValue | null; source: ThemeScope | 'aggregate' | 'native'; explicit: boolean }
