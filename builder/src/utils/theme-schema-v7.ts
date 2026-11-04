import type { ThemeStateV6, ThemeStateV7 } from '@/models/theme.model'
type SchemaSixState = ThemeStateV6

export function migrateThemeToV7(state: SchemaSixState): ThemeStateV7 {
  return { ...structuredClone(state), schemaVersion: 7, foundations: { ...structuredClone(state.foundations), userTokens: state.foundations.userTokens ?? { palettes: {}, colors: {} } }, modeLinks: state.modeLinks ?? {} }
}

export function isThemeStateV7(value: unknown): value is ThemeStateV7 {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const state = value as Record<string, unknown>
  return state.schemaVersion === 7 && typeof state.modeLinks === 'object' && state.modeLinks !== null && !Array.isArray(state.modeLinks)
}
