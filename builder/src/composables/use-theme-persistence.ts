import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { deserializeTheme } from '@/utils/theme-serialization'
import { validateFoundationState } from '@/utils/foundation-validation'
import { createThemeRegistry } from '@/registry/theme-registry'
import { migrateToCurrent, isCurrentVersionFive, isLegacyVersionThree, isVersionFour } from '@/utils/theme-store-normalization'
import { serializeTheme } from '@/utils/theme-store-serialization'
import type { ThemeStateV5 } from '@/models/theme.model'

const registry = createThemeRegistry()

export function useThemePersistence(storageKey: string, recoveryStorageKey: string) {
  return {
    restore: (): ThemeStateV5 => restoreTheme(storageKey, recoveryStorageKey),
    serialize: serializeTheme,
    archive: (value: unknown): void => archiveLegacyTheme(recoveryStorageKey, value),
    readRecovery: (): string | null => typeof localStorage === 'undefined' ? null : localStorage.getItem(recoveryStorageKey),
    clearRecovery: (): void => { try { localStorage.removeItem(recoveryStorageKey) } catch { /* unavailable storage */ } },
  }
}

function restoreTheme(storageKey: string, recoveryStorageKey: string): ThemeStateV5 {
  try {
    const value = typeof localStorage === 'undefined' ? null : localStorage.getItem(storageKey)
    if (!value) return structuredClone(createDefaultCurrentThemeState())
    let parsed: unknown
    try { parsed = JSON.parse(value) } catch { archiveLegacyTheme(recoveryStorageKey, value); return structuredClone(createDefaultCurrentThemeState()) }
    if (isCurrentVersionFive(parsed) || isVersionFour(parsed) || isLegacyVersionThree(parsed)) {
      if (!hasTrustedProvenance(parsed)) archiveLegacyTheme(recoveryStorageKey, value)
      const normalized = migrateToCurrent(parsed as never)
      if (validateFoundationState(normalized.foundations).valid) {
        return normalized
      }
    } else {
      const restored = deserializeTheme(parsed, registry)
      if (restored.valid) return migrateToCurrent(restored.state)
    }
  } catch { /* invalid or unavailable persisted data */ }
  return structuredClone(createDefaultCurrentThemeState())
}

function hasTrustedProvenance(value: ThemeStateV5 | { foundations?: { provenanceVersion?: number } }): boolean {
  return value.foundations?.provenanceVersion === 1
}

function archiveLegacyTheme(key: string, value: unknown): void {
  if (typeof localStorage === 'undefined' || localStorage.getItem(key) !== null) return
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)) } catch { /* unavailable storage */ }
}
