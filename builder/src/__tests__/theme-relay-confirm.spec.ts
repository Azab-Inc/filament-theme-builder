import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { useThemeImport } from '@/composables/use-theme-import'
import { digestBytes } from '@/utils/theme-import-bytes'

const json = '{"schemaVersion":1,"colors":{"primary":"#123456"}}'
beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('relay import confirmation', () => {
  it('rejects stale local revisions before asking the relay for an apply grant', async () => {
    const store = useThemeStore(); const model = useThemeImport(store); const relay = relayStub()
    await model.receiveRelayPayload(await payload(), relay as never); store.setPrimaryColor('#0f766e')
    expect(await model.confirm()).toMatchObject({ ok: false })
    expect(relay.authorizeApply).not.toHaveBeenCalled()
    expect(store.themes).toHaveLength(1)
  })

  it('does not claim local persistence when authorization fails before apply', async () => {
    const store = useThemeStore(); const model = useThemeImport(store); const relay = relayStub()
    relay.authorizeApply.mockRejectedValueOnce(new Error('pairing_required'))
    await model.receiveRelayPayload(await payload(), relay as never)
    expect(await model.confirm()).toMatchObject({ ok: false })
    expect(model.state.error).toMatch(/no theme was created/i)
    expect(store.themes).toHaveLength(1)
    expect(relay.publishImportResult).not.toHaveBeenCalled()
  })

  it('commits a fresh theme once and retries a lost acknowledgement idempotently', async () => {
    const store = useThemeStore(); const model = useThemeImport(store); const relay = relayStub()
    relay.publishImportResult.mockRejectedValueOnce(new Error('lost acknowledgement'))
    await model.receiveRelayPayload(await payload(), relay as never)
    expect(store.themes).toHaveLength(1)
    expect(await model.confirm()).toMatchObject({ ok: false })
    expect(store.activeThemeName).toBe('Relay theme'); expect(store.themes).toHaveLength(2)
    model.cancel(); expect(model.state.open).toBe(true)
    expect(await model.confirm()).toMatchObject({ ok: true })
    expect(store.themes.filter((theme) => theme.id === `import-${'c'.repeat(64)}`)).toHaveLength(1)
    expect(relay.publishImportResult).toHaveBeenCalledTimes(2)
  })

  it('rejects a duplicate confirmation while the first apply authorization is pending', async () => {
    const model = useThemeImport(useThemeStore()); const relay = relayStub()
    let release!: (grant: Awaited<ReturnType<typeof relay.authorizeApply>>) => void
    relay.authorizeApply.mockImplementationOnce(() => new Promise((resolve) => { release = resolve }))
    await model.receiveRelayPayload(await payload(), relay as never)
    const first = model.confirm(); expect(await model.confirm()).toMatchObject({ ok: false })
    expect(relay.authorizeApply).toHaveBeenCalledOnce()
    const [operationId, digest, revision, displayName] = relay.authorizeApply.mock.calls[0]!
    release({ version: 1, status: 'pending', grantId: 'f'.repeat(64), grantExpiresAt: Date.now() + 4_000, operationId, digest, revision, displayName })
    expect(await first).toMatchObject({ ok: true })
  })
})

function relayStub() {
  return {
    acknowledgePayload: vi.fn().mockResolvedValue(undefined), submitPreview: vi.fn().mockResolvedValue(undefined), reject: vi.fn().mockResolvedValue(undefined),
    authorizeApply: vi.fn(async (operationId: string, digest: string, revision: number, displayName: string) => ({
      version: 1 as const, status: 'pending' as const, grantId: 'f'.repeat(64), grantExpiresAt: Date.now() + 4_000, operationId, digest, revision, displayName,
    })),
    publishImportResult: vi.fn().mockResolvedValue(undefined),
  }
}
async function payload() {
  const bytes = new TextEncoder().encode(json)
  return { version: 1 as const, operationId: 'c'.repeat(64), rawJson: json, bytes, filename: 'from-mcp.json', proposedName: 'Relay theme', digest: await digestBytes(bytes), byteLength: bytes.length }
}
