import type { ImportFailureCategory, ImportVersion } from '@/models/theme-import.model'

type ValidationResult = { valid: true; version: ImportVersion } | { valid: false; category: ImportFailureCategory; message: string }
const keys: Record<ImportVersion, string[]> = {
  1: ['schemaVersion', 'colors'],
  2: ['schemaVersion', 'colors', 'overrides'],
  3: ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss', 'icons', 'branding'],
  4: ['schemaVersion', 'colors', 'foundations', 'overrides', 'rawOverrides', 'customCss', 'icons', 'branding'],
}

export function validateImportDocument(value: unknown): ValidationResult {
  if (!isRecord(value)) return { valid: false, category: 'invalid_schema_shape', message: 'Theme import root must be an object' }
  if ('theme' in value && !('schemaVersion' in value)) return { valid: false, category: 'invalid_schema_shape', message: 'Theme import envelope is not supported' }
  if (!('schemaVersion' in value)) return { valid: false, category: 'missing_schema_version', message: 'Theme import schemaVersion is required' }
  const version = value.schemaVersion
  if (version !== 1 && version !== 2 && version !== 3 && version !== 4) return { valid: false, category: 'unsupported_schema_version', message: 'Unsupported theme schema version' }
  const allowed = new Set(keys[version])
  if (Object.keys(value).some((key) => !allowed.has(key))) return { valid: false, category: 'invalid_schema_shape', message: 'Theme import contains unknown fields' }
  return { valid: true, version }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
