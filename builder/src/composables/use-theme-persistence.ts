import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { deserializeTheme } from '@/utils/theme-serialization'
import { validateFoundationState } from '@/utils/foundation-validation'
import { createThemeRegistry } from '@/registry/theme-registry'
import { migrateToCurrent, normalizeTheme, isLegacyVersionThree, isVersionFour } from '@/utils/theme-store-normalization'
import { serializeTheme } from '@/utils/theme-store-serialization'
import type { ThemeStateV4 } from '@/models/theme.model'

const registry = createThemeRegistry()

export function useThemePersistence(storageKey: string, recoveryStorageKey: string) {
  return {
    restore: (): ThemeStateV4 => restoreTheme(storageKey, recoveryStorageKey),
    serialize: serializeTheme,
    archive: (value: unknown): void => archiveLegacyTheme(recoveryStorageKey, value),
    readRecovery: (): string | null => typeof localStorage === 'undefined' ? null : localStorage.getItem(recoveryStorageKey),
    clearRecovery: (): void => { try { localStorage.removeItem(recoveryStorageKey) } catch { /* unavailable storage */ } },
  }
}

function restoreTheme(storageKey: string, recoveryStorageKey: string): ThemeStateV4 {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    if (!value) return structuredClone(createDefaultThemeState())
    let parsed: unknown
    try { parsed = JSON.parse(value) } catch { archiveLegacyTheme(recoveryStorageKey, value); return structuredClone(createDefaultThemeState()) }
    if (isVersionFour(parsed) || isLegacyVersionThree(parsed)) {
      if (!hasTrustedProvenance(parsed)) archiveLegacyTheme(recoveryStorageKey, value)
      const normalized = normalizeTheme(isVersionFour(parsed) ? parsed : { ...parsed, schemaVersion: 4, rawOverrides: [] })
      if (validateFoundationState(normalized.foundations).valid) {
        if (!hasTrustedProvenance(parsed)) save(storageKey, normalized)
        return normalized
      }
    } else {
      const restored = deserializeTheme(parsed, registry)
      if (restored.valid) return migrateToCurrent(restored.state)
    }
  } catch { /* invalid or unavailable persisted data */ }
  return structuredClone(createDefaultThemeState())
}

function hasTrustedProvenance(value: ThemeStateV4 | { foundations?: { provenanceVersion?: number } }): boolean {
  return value.foundations?.provenanceVersion === 1
}

function archiveLegacyTheme(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined' || localStorage.getItem(key) !== null) return
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)) } catch { /* unavailable storage */ }
}

function save(key: string, value: ThemeStateV4): void {
  try { localStorage.setItem(key, JSON.stringify(serializeTheme(value))) } catch { /* unavailable storage */ }
}
