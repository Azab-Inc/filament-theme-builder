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

export type ThemeState = ThemeStateV1 | ThemeStateV2

export type ResolveRequest = {
  targetId: string
  controlId: string
  componentId?: string
  variantId?: string
  stateId?: string
}

export type ResolveResult =
  | { status: 'resolved'; value: ThemeValue; source: ThemeScope | 'registry-default' | 'legacy-global' }
  | { status: 'unresolved'; targetId: string; controlId: string }
