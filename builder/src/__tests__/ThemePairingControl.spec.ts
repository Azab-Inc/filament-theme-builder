import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import ThemePairingControl from '@/components/ThemePairingControl.vue'

const { start, status, approve, relayStart, disconnect } = vi.hoisted(() => ({ start: vi.fn(), status: vi.fn(), approve: vi.fn(), relayStart: vi.fn(), disconnect: vi.fn() }))
vi.mock('@/composables/use-theme-pairing', () => ({
  createThemePairingClient: () => ({ start, status, approve }),
}))
vi.mock('@/composables/use-theme-relay', () => ({ createThemeRelayClient: () => ({ start: relayStart, disconnect }) }))

describe('ThemePairingControl', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    start.mockReset().mockResolvedValue({ pairingId: 'pair', tabKey: new Uint8Array(32), sessionId: null, expiresAt: Date.now() + 60_000 })
    status.mockReset().mockResolvedValue({ version: 1, pairingId: 'pair', status: 'pending', expiresAt: Date.now() + 60_000 })
    approve.mockReset().mockImplementation(async (pairing) => { pairing.sessionId = 'session'; pairing.expiresAt = Date.now() + 60_000; return { status: 'approved' } })
    relayStart.mockReset().mockReturnValue(vi.fn())
    disconnect.mockReset().mockResolvedValue(undefined)
  })

  it('starts a same-origin pairing and announces that it is pending', async () => {
    const wrapper = mount(ThemePairingControl)
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeUndefined()
    await button.trigger('click')
    expect(start).toHaveBeenCalledOnce()
    expect(wrapper.get('[role="status"]').text()).toContain('Pairing request created')
  })

  it('shows the pending client claim and requires explicit browser approval', async () => {
    status.mockResolvedValue({ version: 1, pairingId: 'pair', status: 'pending', claimId: 'f'.repeat(64), expiresAt: Date.now() + 60_000 })
    const wrapper = mount(ThemePairingControl)
    await wrapper.get('button[aria-label="Pair local client"]').trigger('click')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('local MCP client')
    await wrapper.get('button[aria-label="Approve pairing"]').trigger('click')
    expect(approve).toHaveBeenCalledWith(expect.objectContaining({ pairingId: 'pair' }), 'f'.repeat(64))
    expect(relayStart).toHaveBeenCalledOnce()
    expect(wrapper.get('[role="status"]').text()).toContain('connected')
  })

  it('disconnects an approved relay explicitly', async () => {
    status.mockResolvedValue({ version: 1, pairingId: 'pair', status: 'pending', claimId: 'f'.repeat(64), expiresAt: Date.now() + 60_000 })
    const wrapper = mount(ThemePairingControl)
    await wrapper.get('button[aria-label="Pair local client"]').trigger('click')
    await flushPromises()
    await wrapper.get('button[aria-label="Approve pairing"]').trigger('click')
    await wrapper.get('button[aria-label="Disconnect local client"]').trigger('click')
    expect(disconnect).toHaveBeenCalledOnce()
    expect(wrapper.get('[role="status"]').text()).toContain('disconnected')
  })
})
