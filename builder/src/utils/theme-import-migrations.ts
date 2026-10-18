import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { MigrationResult, ImportVersion } from '@/models/theme-import.model'
import type { ThemeState, ThemeStateV1, ThemeStateV2, ThemeStateV3, ThemeStateV4 } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { validateThemeState } from '@/utils/theme-validation'

export function migrateVersionedTheme(value: ThemeState, registry: FilamentRegistry): MigrationResult {
  const sourceVersion = value.schemaVersion as ImportVersion
  let current: ThemeState = structuredClone(value)
  validateEdge(current, registry)
  const migrationPath = [sourceVersion]
  const decisions: string[] = []
  if (current.schemaVersion === 1) { current = toV2(current); validateEdge(current, registry); migrationPath.push(2); decisions.push('Created empty overrides collection') }
  if (current.schemaVersion === 2) { current = toV3(current); validateEdge(current, registry); migrationPath.push(3); decisions.push('Applied foundation defaults and preserved legacy overrides') }
  if (current.schemaVersion === 3) { current = toV4(current); validateEdge(current, registry); migrationPath.push(4); decisions.push('Created empty raw override collection') }
  validateEdge(current, registry)
  return { state: structuredClone(current as ThemeStateV4), sourceVersion, migrationPath, decisions }
}

function validateEdge(value: ThemeState, registry: FilamentRegistry): void {
  if (value.schemaVersion === 1 || value.schemaVersion === 2) {
    const result = validateThemeState(value, registry)
    if (!result.valid) throw new Error(result.invalidOverrides[0]?.error ?? 'Invalid theme state')
    return
  }
  const result = validateFoundationState(value)
  if (!result.valid) throw new Error(result.message)
}

function toV2(value: ThemeStateV1): ThemeStateV2 {
  return { schemaVersion: 2, colors: structuredClone(value.colors), overrides: [] }
}

function toV3(value: ThemeStateV2): ThemeStateV3 {
  const defaults = createDefaultThemeState()
  defaults.foundations.palettes.primary.base = value.colors.primary
  const { rawOverrides: _rawOverrides, ...foundationState } = defaults
  return { ...foundationState, schemaVersion: 3, colors: structuredClone(value.colors), overrides: structuredClone(value.overrides) }
}

function toV4(value: ThemeStateV3): ThemeStateV4 {
  return { ...structuredClone(value), schemaVersion: 4, rawOverrides: [] }
}
