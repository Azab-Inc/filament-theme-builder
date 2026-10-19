import { describe, expect, it } from 'vitest'
import { useThemeStore } from '@/stores/theme'
import { approvedRelayImport } from '@/__tests__/theme-relay-apply-test-helpers'

describe('relay import apply validation', () => {
  it.each([
    ['altered digest', { payloadDigest: 'b'.repeat(64) }],
    ['oversized bytes', { rawBytes: new Uint8Array(1_048_577) }],
    ['altered source version', { sourceVersion: 4 }], ['blank name', { proposedName: '   ' }],
    ['expired grant', { grant: { version: 1, status: 'pending', grantId: 'f'.repeat(64), grantExpiresAt: 0, operationId: 'a'.repeat(64), digest: 'b'.repeat(64), revision: 0, displayName: 'Relay import' } }],
    ['unapproved grant', { grant: { version: 1, status: 'rejected', grantId: 'f'.repeat(64), grantExpiresAt: Date.now() + 5_000, operationId: 'a'.repeat(64), digest: 'b'.repeat(64), revision: 0, displayName: 'Relay import' } }],
    ['expired operation', { operationExpiresAt: 0 }], ['altered name', { proposedName: 'Changed after preview' }],
    ['invalid operation identity', { operationId: 'not-a-random-operation' }], ['invalid state', { state: {} }],
    ['nonempty custom CSS', { rawBytes: new TextEncoder().encode('{"schemaVersion":4,"customCss":"body { color:red }"}') }],
  ])('rejects %s without creating a record or marker', async (_label, overrides) => {
    const store = useThemeStore(); const revision = store.revision
    expect(await approvedRelayImport(store, overrides)).toMatchObject({ ok: false })
    expect(store.themes).toHaveLength(1); expect(store.revision).toBe(revision)
    expect(localStorage.getItem(`ftb-theme-import:${'a'.repeat(64)}`)).toBeNull()
  })
})
