import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { validateRawOverrides } from '@/utils/raw-override-validation'
import { createDefaultIconConfiguration } from '@/registry/icon-registry'
import { createDefaultPanelBrandingSettings } from '@/utils/panel-branding-validation'
import type { ThemeState, ThemeStateV3, ThemeStateV4 } from '@/models/theme.model'
import { rebuildPalette } from '@/utils/theme-store-palettes'
import { cloneTheme, isRecord } from '@/utils/theme-store-helpers'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { createThemeRegistry } from '@/registry/theme-registry'

export function normalizeTheme(value: ThemeStateV4): ThemeStateV4 {
  const normalized = cloneTheme(value)
  if (!Array.isArray(normalized.rawOverrides) || !validateRawOverrides(normalized.rawOverrides).valid) normalized.rawOverrides = []
  if (!normalized.icons) normalized.icons = createDefaultIconConfiguration()
  if (!normalized.branding) normalized.branding = createDefaultPanelBrandingSettings()
  if (normalized.foundations.provenanceVersion !== 1) {
    normalized.foundations = createDefaultFoundationState()
    normalized.colors.primary = normalized.foundations.palettes.primary.base
  }
  normalizePalettes(normalized)
  return normalized
}

export function normalizePalettes(value: ThemeStateV4): void {
  value.colors.primary = value.foundations.palettes.primary.base
  for (const palette of Object.values(value.foundations.palettes)) rebuildPalette(palette)
}

export function migrateToCurrent(state: ThemeState): ThemeStateV4 {
  const migrated = migrateVersionedTheme(state, createThemeRegistry())
  if (!migrated.ok) throw new Error(`${migrated.category}: ${migrated.message}`)
  return normalizeTheme(migrated.state)
}

export function isVersionFour(value: unknown): value is ThemeStateV4 {
  return isRecord(value) && value.schemaVersion === 4 && Array.isArray(value.rawOverrides)
}

export function isLegacyVersionThree(value: unknown): value is ThemeStateV3 {
  return isRecord(value) && value.schemaVersion === 3
}
