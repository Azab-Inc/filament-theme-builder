import { describe, expect, it } from 'vitest'

import { createThemeRegistry } from '@/registry/theme-registry'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { digestBytes } from '@/utils/theme-import-bytes'
import { MAX_THEME_IMPORT_BYTES, parseAndMigrateTheme, previewThemeImport } from '@/utils/theme-import-service'

const registry = createThemeRegistry()
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value))

describe('versioned theme import service', () => {
  it('accepts exactly one MiB before parsing', async () => {
    const result = await previewThemeImport(new Uint8Array(MAX_THEME_IMPORT_BYTES).fill(32), 'large.json', 'Large', registry)
    expect(result).toMatchObject({ valid: false, category: 'invalid_json' })
  })

  it('rejects multibyte payloads by encoded byte length', async () => {
    const payload = new Uint8Array(MAX_THEME_IMPORT_BYTES).fill(32)
    const result = await previewThemeImport(new Uint8Array([...payload, 0xc3, 0xa9]), 'large.json', 'Large', registry)
    expect(result).toMatchObject({ valid: false, category: 'payload_too_large' })
  })

  it('classifies invalid encoding and malformed JSON', async () => {
    await expect(previewThemeImport(new Uint8Array([0xc3, 0x28]), 'bad.json', '', registry)).resolves.toMatchObject({ valid: false, category: 'invalid_encoding' })
    await expect(previewThemeImport(new TextEncoder().encode('{bad'), 'bad.json', '', registry)).resolves.toMatchObject({ valid: false, category: 'invalid_json' })
  })

  it('rejects missing schema, envelopes, and unsupported versions', () => {
    expect(parseAndMigrateTheme(bytes({ colors: { primary: '#123456' } }), 'x.json', '', registry)).toMatchObject({ ok: false, category: 'missing_schema_version' })
    expect(parseAndMigrateTheme(bytes({ schemaVersion: 9 }), 'x.json', '', registry)).toMatchObject({ ok: false, category: 'unsupported_schema_version' })
    expect(parseAndMigrateTheme(bytes({ theme: { schemaVersion: 4 } }), 'x.json', '', registry)).toMatchObject({ ok: false, category: 'invalid_schema_shape' })
  })

  it('migrates every source version without mutating input', () => {
    const source = { schemaVersion: 1 as const, colors: { primary: '#123456' } }
    const before = structuredClone(source)
    const result = parseAndMigrateTheme(bytes(source), 'x.json', '', registry)
    expect(result).toMatchObject({ ok: true, sourceVersion: 1, migrationPath: [1, 2, 3, 4] })
    expect(source).toEqual(before)
    expect((parseAndMigrateTheme(bytes({ schemaVersion: 2, colors: { primary: '#123456' }, overrides: [] }), 'x.json', '', registry)).ok).toBe(true)
    expect((parseAndMigrateTheme(bytes(createDefaultThemeState()), 'x.json', '', registry)).ok).toBe(true)
  })

  it('rejects nonempty custom CSS rather than dropping it', () => {
    const state = { ...createDefaultThemeState(), customCss: '.unsafe { color: red }' }
    expect(parseAndMigrateTheme(bytes(state), 'x.json', '', registry)).toMatchObject({ ok: false, category: 'nonempty_custom_css_rejected' })
  })

  it('uses proposed name then filename fallback and returns digest metadata', async () => {
    const payload = bytes(createDefaultThemeState())
    const result = await previewThemeImport(payload, 'customer-theme.json', '  ', registry)
    expect(result).toMatchObject({ valid: true, preview: { displayName: 'customer-theme', byteLength: payload.byteLength } })
    expect(result.valid && result.preview.payloadDigest).toBe(await digestBytes(payload))
  })
})
