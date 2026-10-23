import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { handleRelayNotices } from '@/composables/use-theme-relay-operations'
import { useThemeStore } from '@/stores/theme'

beforeEach(() => { localStorage.clear(); setActivePinia(createPinia()) })

describe('relay read-only operation routing', () => {
  it('reads the latest active canonical state without flushing or changing storage', () => {
    const store = useThemeStore(); const activeId = store.activeThemeId
    store.setPrimaryColor('#0f766e')
    expect(store.getThemeState(activeId)?.colors.primary).toBe('#0f766e')
    expect(store.activeThemeId).toBe(activeId)
  })

  it('returns local metadata and canonical export without changing the theme collection', async () => {
    const store = useThemeStore(); const count = store.themes.length; const active = store.activeThemeId
    const relay = { publishListResult: vi.fn(), publishExportResult: vi.fn(), reject: vi.fn().mockResolvedValue(undefined) }
    await handleRelayNotices([
      { operationId: 'a'.repeat(64), kind: 'list', status: 'pending' },
      { operationId: 'b'.repeat(64), kind: 'export', status: 'pending', themeId: active },
    ], relay as never, store, vi.fn())
    expect(relay.publishListResult).toHaveBeenCalledWith('a'.repeat(64), [{ id: active, name: 'Untitled', updatedAt: expect.any(Number), active: true }])
    expect(relay.publishExportResult).toHaveBeenCalledWith('b'.repeat(64), expect.stringContaining('"schemaVersion":5'))
    expect(store.themes).toHaveLength(count); expect(store.activeThemeId).toBe(active)
  })

  it('routes import notices to preview handoff without applying them', async () => {
    const store = useThemeStore(); const payload = { operationId: 'c'.repeat(64), rawJson: '{}', bytes: new Uint8Array(), version: 1, filename: 'x.json', proposedName: 'x', digest: 'd'.repeat(64), byteLength: 2 }
    const relay = { receivePayload: vi.fn().mockResolvedValue(payload), publishListResult: vi.fn(), publishExportResult: vi.fn(), reject: vi.fn() }
    const handoff = vi.fn().mockResolvedValue(undefined)
    await handleRelayNotices([{ operationId: payload.operationId, kind: 'import', status: 'pending' }], relay as never, store, handoff)
    expect(handoff).toHaveBeenCalledWith(payload, relay)
    expect(store.themes).toHaveLength(1)
  })
})
