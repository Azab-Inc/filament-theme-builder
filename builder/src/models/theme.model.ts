import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { createThemeRegistry } from '@/registry/theme-registry'

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
  const result = migrateVersionedTheme(state, createThemeRegistry())
  if (!result.ok) throw new Error(`${result.category}: ${result.message}`)
  return result.state
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
