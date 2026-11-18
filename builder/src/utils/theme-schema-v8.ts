import type { ThemeStateV7, ThemeStateV8 } from '@/models/theme.model'
export function migrateThemeToV8(state: ThemeStateV7): ThemeStateV8 { return { ...structuredClone(state), schemaVersion: 8, borderEdges: [] } }
