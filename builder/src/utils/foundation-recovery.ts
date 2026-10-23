import type { ThemeStateV5, ThemeOverride } from '@/models/theme.model'
import { isRecord, mergeLegacyFoundations } from '@/utils/foundation-recovery-paths'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { validateRawOverrides } from '@/utils/raw-override-validation'

export function restoreLegacyTheme(value: unknown): ThemeStateV5 | null {
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value)
    } catch {
      return null
    }
  }
  if (!isRecord(value) || (value.schemaVersion !== 3 && value.schemaVersion !== 4) || !isRecord(value.foundations)) return null
  const legacy = JSON.parse(JSON.stringify(value)) as Record<string, any>

  const defaults = createDefaultCurrentThemeState()
  const foundations = mergeLegacyFoundations(defaults.foundations, legacy.foundations)
  const rawOverrides = validateRawOverrides(legacy.rawOverrides).valid ? structuredClone(legacy.rawOverrides) : []
  const restored: ThemeStateV5 = {
    schemaVersion: 5,
    colors: { primary: foundations.palettes.primary.base },
    foundations,
    overrides: Array.isArray(legacy.overrides) ? structuredClone(legacy.overrides) as ThemeOverride[] : [],
    rawOverrides,
    padding: [],
    customCss: typeof legacy.customCss === 'string' ? legacy.customCss : '',
    icons: defaults.icons,
    branding: defaults.branding,
  }

  const validation = validateFoundationState(restored.foundations)
  return validation.valid ? restored : null
}

export function legacyRecoveryError(value: string | null): string | null {
  if (value === null) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  } catch {
    return 'Archived data is not valid JSON. You can download it, but it cannot be restored.'
  }
  if (!isRecord(parsed) || (parsed.schemaVersion !== 3 && parsed.schemaVersion !== 4) || !isRecord(parsed.foundations)) {
    return 'Archived data does not match the supported legacy theme format and cannot be restored.'
  }
  if (restoreLegacyTheme(parsed) === null) {
    return 'Archived theme contains invalid or unsupported values and cannot be restored.'
  }
  return null
}
