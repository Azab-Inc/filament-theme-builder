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

export type ThemeState = ThemeStateV1 | ThemeStateV2

export function migrateThemeState(state: ThemeState): ThemeStateV2 {
  if (state.schemaVersion === 2) return structuredClone(state)
  return {
    schemaVersion: 2,
    colors: { primary: state.colors.primary },
    overrides: [],
  }
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
