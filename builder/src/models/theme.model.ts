import { createDefaultThemeState } from '@/services/foundation-defaults'

export type ThemeScope = 'global' | 'component' | 'variant' | 'state'

export type ThemeValue = string | number | boolean

export type ThemeOverride = {
  targetId: string
  controlId: string
  scope: ThemeScope
  componentId?: string
  variantId?: string
  stateId?: string
  value: ThemeValue
}

export type ThemeStateV1 = {
  schemaVersion: 1
  colors: {
    primary: string
  }
}

export type ThemeStateV2 = {
  schemaVersion: 2
  colors: {
    primary: string
  }
  overrides: ThemeOverride[]
}

export type ThemeStateV3 = import('@/models/foundations.model').FoundationStateV3
export type ThemeStateV4 = import('@/models/foundations.model').FoundationStateV4

export type ThemeState = ThemeStateV1 | ThemeStateV2 | ThemeStateV3 | ThemeStateV4

export function migrateThemeState(state: ThemeState): ThemeStateV4 {
  if (state.schemaVersion === 4) return structuredClone(state)
  if (state.schemaVersion === 3) return { ...structuredClone(state), schemaVersion: 4, rawOverrides: [] }

  const current = createDefaultThemeState()
  current.colors.primary = state.colors.primary
  current.foundations.palettes.primary.base = state.colors.primary
  current.overrides = state.schemaVersion === 2 ? structuredClone(state.overrides) : []
  return current
}

export type ResolveRequest = {
  targetId: string
  controlId: string
  componentId?: string
  variantId?: string
  stateId?: string
}

export type ResolveResult =
  | { status: 'resolved'; value: ThemeValue; source: ThemeScope | 'registry-default' }
  | { status: 'unresolved'; targetId: string; controlId: string }
  | { status: 'invalid-request' | 'invalid-state'; targetId?: string; controlId?: string; error: string }
