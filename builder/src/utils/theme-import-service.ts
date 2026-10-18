import type { FilamentRegistry } from '@/models/theme-registry.model'
import { MAX_THEME_IMPORT_BYTES, type ImportResult, type SyncImportResult } from '@/models/theme-import.model'
import { decodeThemeBytes, digestBytes } from '@/utils/theme-import-bytes'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { importDisplayName, importSummary } from '@/utils/theme-import-preview'
import { validateImportDocument } from '@/utils/theme-import-validation'

export { MAX_THEME_IMPORT_BYTES }
export { digestBytes }

/** Filename and proposedName remain for parity with the async preview boundary; sync parsing does not use display metadata. */
export function parseAndMigrateTheme(bytes: Uint8Array, _filename: string, _proposedName: string, registry: FilamentRegistry): SyncImportResult {
  if (bytes.byteLength > MAX_THEME_IMPORT_BYTES) return { ok: false, category: 'payload_too_large', message: 'Theme import exceeds the 1 MiB limit' }
  let parsed: unknown
  try { parsed = JSON.parse(decodeThemeBytes(bytes)) } catch (error) {
    return { ok: false, category: error instanceof SyntaxError ? 'invalid_json' : 'invalid_encoding', message: error instanceof Error ? error.message : 'Invalid theme import' }
  }
  const shape = validateImportDocument(parsed)
  if (!shape.valid) return { ok: false, category: shape.category, message: shape.message }
  try {
    const migrated = migrateVersionedTheme(parsed as never, registry)
    if (!migrated.ok) return migrated
    return { ok: true, value: migrated.state, sourceVersion: migrated.sourceVersion, migrationPath: migrated.migrationPath, decisions: migrated.decisions }
  } catch (error) {
    return { ok: false, category: 'migration_failed', message: error instanceof Error ? error.message : 'Theme migration failed' }
  }
}

export async function previewThemeImport(bytes: Uint8Array, filename: string, proposedName: string, registry: FilamentRegistry): Promise<ImportResult> {
  if (bytes.byteLength > MAX_THEME_IMPORT_BYTES) return { valid: false, category: 'payload_too_large', message: 'Theme import exceeds the 1 MiB limit' }
  const parsed = parseAndMigrateTheme(bytes, filename, proposedName, registry)
  if (!parsed.ok) return { valid: false, category: parsed.category, message: parsed.message }
  return { valid: true, preview: { sourceVersion: parsed.sourceVersion, targetVersion: 4, migrationPath: parsed.migrationPath, displayName: importDisplayName(filename, proposedName), summary: importSummary(parsed.sourceVersion, parsed.migrationPath, parsed.decisions), payloadDigest: await digestBytes(bytes), byteLength: bytes.byteLength, state: parsed.value } }
}
