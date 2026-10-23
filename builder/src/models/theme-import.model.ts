import type { FilamentRegistry } from '@/models/theme-registry.model'
import type { ThemeStateV5 } from '@/models/theme.model'

export const MAX_THEME_IMPORT_BYTES = 1_048_576
export type ImportVersion = 1 | 2 | 3 | 4 | 5
export type ImportFailureCategory = 'payload_too_large' | 'invalid_encoding' | 'invalid_json' | 'missing_schema_version' | 'unsupported_schema_version' | 'invalid_schema_shape' | 'migration_failed' | 'nonempty_custom_css_rejected' | 'invalid_theme_state'
export type ImportPreview = { sourceVersion: ImportVersion; targetVersion: 5; migrationPath: number[]; displayName: string; summary: string[]; payloadDigest: string; byteLength: number; state: ThemeStateV5 }
export type SyncImportResult = { ok: true; value: ThemeStateV5; sourceVersion: ImportVersion; migrationPath: number[]; decisions: string[] } | { ok: false; category: ImportFailureCategory; message: string }
export type ImportResult = { valid: true; preview: ImportPreview } | { valid: false; category: ImportFailureCategory; message: string }
export type MigrationSuccess = { ok: true; state: ThemeStateV5; sourceVersion: ImportVersion; migrationPath: number[]; decisions: string[] }
export type MigrationFailure = { ok: false; category: Extract<ImportFailureCategory, 'migration_failed' | 'nonempty_custom_css_rejected' | 'invalid_theme_state'>; message: string }
export type MigrationResult = MigrationSuccess | MigrationFailure
export type ImportRequest = { bytes: Uint8Array; filename: string; proposedName: string; registry: FilamentRegistry }
