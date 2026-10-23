import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { MigrationFailure, MigrationResult, ImportVersion } from '@/models/theme-import.model'
import type { ThemeState, ThemeStateV1, ThemeStateV2, ThemeStateV3, ThemeStateV4, ThemeStateV5 } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { validateThemeState } from '@/utils/theme-validation'
import { rebuildPalette } from '@/utils/theme-store-palettes'

export function migrateVersionedTheme(value: ThemeState, registry?: FilamentRegistry): MigrationResult {
  try {
    const sourceVersion = value.schemaVersion as ImportVersion
    let current: ThemeState = structuredClone(value)
    const initial = validateEdge(current, registry)
    if (!initial.ok) return initial
    const migrationPath = [sourceVersion]
    const decisions: string[] = []
    if (current.schemaVersion === 1) { current = toV2(current); const edge = validateEdge(current, registry); if (!edge.ok) return edge; migrationPath.push(2); decisions.push('Created empty overrides collection') }
    if (current.schemaVersion === 2) { current = toV3(current); const edge = validateEdge(current, registry); if (!edge.ok) return edge; migrationPath.push(3); decisions.push('Applied foundation defaults and preserved legacy overrides') }
    if (current.schemaVersion === 3) { current = toV4(current); const edge = validateEdge(current, registry); if (!edge.ok) return edge; migrationPath.push(4); decisions.push('Created empty raw override collection') }
    if (current.schemaVersion === 4) { current = toV5(current); const edge = validateEdge(current, registry); if (!edge.ok) return edge; migrationPath.push(5); decisions.push('Created empty sparse padding collection') }
    return { ok: true, state: structuredClone(current as ThemeStateV5), sourceVersion, migrationPath, decisions }
  } catch (error) {
    return { ok: false, category: 'migration_failed', message: error instanceof Error ? error.message : 'Theme migration failed' }
  }
}

export function recoverVersionedTheme(value: ThemeStateV3 | ThemeStateV4 | ThemeStateV5): ThemeStateV5 {
  if (value.schemaVersion === 5) return structuredClone(value)
  const result = migrateVersionedTheme(value)
  return result.ok ? result.state : toV5(value.schemaVersion === 3 ? toV4(value) : value)
}

function validateEdge(value: ThemeState, registry?: FilamentRegistry): MigrationFailure | { ok: true } {
  if (!registry) return { ok: true }
  if (value.schemaVersion === 1 || value.schemaVersion === 2) {
    const allowed = value.schemaVersion === 1 ? ['schemaVersion', 'colors'] : ['schemaVersion', 'colors', 'overrides']
    if (Object.keys(value).some((key) => !allowed.includes(key))) return { ok: false, category: 'invalid_theme_state', message: 'Legacy theme contains unknown fields' }
    const result = validateThemeState(value, registry)
    if (!result.valid) return { ok: false, category: 'invalid_theme_state', message: result.invalidOverrides[0]?.error ?? 'Invalid theme state' }
    return { ok: true }
  }
  const result = validateFoundationState(value, registry)
  if (!result.valid) return { ok: false, category: result.path === 'customCss' ? 'nonempty_custom_css_rejected' : 'invalid_theme_state', message: result.message }
  return { ok: true }
}

function toV2(value: ThemeStateV1): ThemeStateV2 {
  return { schemaVersion: 2, colors: structuredClone(value.colors), overrides: [] }
}

function toV3(value: ThemeStateV2): ThemeStateV3 {
  const defaults = createDefaultThemeState()
  defaults.foundations.palettes.primary.base = value.colors.primary
  rebuildPalette(defaults.foundations.palettes.primary)
  const { rawOverrides: _rawOverrides, ...foundationState } = defaults
  return { ...foundationState, schemaVersion: 3, colors: structuredClone(value.colors), overrides: structuredClone(value.overrides) }
}

function toV4(value: ThemeStateV3): ThemeStateV4 {
  return { ...structuredClone(value), schemaVersion: 4, rawOverrides: [] }
}

function toV5(value: ThemeStateV4): ThemeStateV5 {
  return { ...structuredClone(value), schemaVersion: 5, padding: [] }
}
