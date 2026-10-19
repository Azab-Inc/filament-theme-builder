import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useThemeStore } from '@/stores/theme'
import { useThemeImport } from '@/composables/use-theme-import'
import { digestBytes } from '@/utils/theme-import-bytes'
import { createDefaultThemeState } from '@/utils/foundation-defaults'

const json = '{"schemaVersion":1,"colors":{"primary":"#123456"}}'
beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('relay import preview boundary', () => {
  it('routes verified bytes into the isolated preview and acknowledges receipt', async () => {
    const store = useThemeStore(); const model = useThemeImport(store); const relay = relayStub(); const input = await payload()
    await model.receiveRelayPayload(input, relay as never)
    expect(model.state.preview?.migrationPath).toEqual([1, 2, 3, 4])
    expect(store.themes).toHaveLength(1)
    expect(relay.acknowledgePayload).toHaveBeenCalledWith(input.operationId, input.digest)
    expect(relay.submitPreview).toHaveBeenCalledWith(input.operationId, expect.objectContaining({ payloadDigest: input.digest, byteLength: input.byteLength }))
  })

  it('rejects digest mismatch without receipt or theme mutation', async () => {
    const store = useThemeStore(); const model = useThemeImport(store); const relay = relayStub(); const input = await payload()
    await model.receiveRelayPayload({ ...input, digest: 'e'.repeat(64) }, relay as never)
    expect(model.state.preview).toBeNull()
    expect(relay.acknowledgePayload).not.toHaveBeenCalled()
    expect(relay.reject).toHaveBeenCalledWith(input.operationId, 'invalid_theme')
    expect(store.themes).toHaveLength(1)
  })

  it('rejects a CSS-bearing theme before receipt or apply', async () => {
    const model = useThemeImport(useThemeStore()); const relay = relayStub(); const state = createDefaultThemeState()
    state.customCss = '.fi-btn { color: red; }'
    const input = await payload(JSON.stringify(state), 'd')
    await model.receiveRelayPayload(input, relay as never)
    expect(model.state.preview).toBeNull()
    expect(relay.acknowledgePayload).not.toHaveBeenCalled()
    expect(relay.reject).toHaveBeenCalledWith(input.operationId, 'invalid_theme')
  })

  it('cancels preview without mutation and rejects the remote operation', async () => {
    const store = useThemeStore(); const model = useThemeImport(store); const relay = relayStub(); const input = await payload()
    await model.receiveRelayPayload(input, relay as never); model.cancel(); await Promise.resolve()
    expect(store.themes).toHaveLength(1)
    expect(relay.reject).toHaveBeenCalledWith(input.operationId, 'operation_failed')
  })

  it('does not replace an already-open local preview', async () => {
    const model = useThemeImport(useThemeStore()); await model.chooseFile(new File([json], 'local.json'))
    const relay = relayStub(); const input = await payload(); const localFilename = model.state.filename
    await model.receiveRelayPayload(input, relay as never)
    expect(model.state.filename).toBe(localFilename)
    expect(relay.reject).toHaveBeenCalledWith(input.operationId, 'operation_failed')
    expect(relay.acknowledgePayload).not.toHaveBeenCalled()
  })
})

function relayStub() {
  return { acknowledgePayload: vi.fn().mockResolvedValue(undefined), submitPreview: vi.fn().mockResolvedValue(undefined), reject: vi.fn().mockResolvedValue(undefined) }
}
async function payload(rawJson = json, id = 'c') {
  const bytes = new TextEncoder().encode(rawJson)
  return { version: 1 as const, operationId: id.repeat(64), rawJson, bytes, filename: 'from-mcp.json', proposedName: 'Relay theme', digest: await digestBytes(bytes), byteLength: bytes.length }
}
