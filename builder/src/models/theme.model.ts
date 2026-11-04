import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { createThemeRegistry } from '@/registry/theme-registry'
import type { ThemeMode } from '@/models/foundations.model'

export type ThemeScope = 'global' | 'component' | 'variant' | 'state'

export type ThemeValue = string | number | boolean

export type ThemeOverride = {
  targetId: string
  controlId: string
  scope: ThemeScope
  componentId?: string
  variantId?: string
  stateId?: string
  value?: ThemeValue
  darkValue?: ThemeValue
  mode?: ThemeMode
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
export type ThemeStateV5 = Omit<ThemeStateV4, 'schemaVersion'> & {
  schemaVersion: 5
  padding: import('@/models/padding.model').PaddingRecord[]
}
export type ThemeStateV6 = Omit<ThemeStateV5, 'schemaVersion'> & { schemaVersion: 6; modeLinks?: import('@/models/theme-mode-link.model').ModeLinkMap }
export type ThemeStateV7 = Omit<ThemeStateV6, 'schemaVersion'> & {
  schemaVersion: 7
  foundations: Omit<ThemeStateV6['foundations'], 'userTokens'> & { userTokens: import('@/models/user-tokens.model').UserTokens }
  modeLinks: import('@/models/theme-mode-link.model').ModeLinkMap
}
export type ThemeStateCurrent = ThemeStateV7
export type ThemeStateInput = ThemeStateV4 | ThemeStateV5 | ThemeStateV6 | ThemeStateV7

export type ThemeState = ThemeStateV1 | ThemeStateV2 | ThemeStateV3 | ThemeStateV4 | ThemeStateV5 | ThemeStateV6 | ThemeStateV7

export function migrateThemeState(state: ThemeState): ThemeStateCurrent {
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
  mode?: ThemeMode
}

export type ResolveResult =
  | { status: 'resolved'; value: ThemeValue; source: ThemeScope | 'registry-default' }
  | { status: 'unresolved'; targetId: string; controlId: string }
  | { status: 'invalid-request' | 'invalid-state'; targetId?: string; controlId?: string; error: string }
