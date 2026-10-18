import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ThemePairingControl from '@/components/ThemePairingControl.vue'

const start = vi.fn()
vi.mock('@/composables/use-theme-pairing', () => ({
  createThemePairingClient: () => ({ start }),
}))

describe('ThemePairingControl', () => {
  beforeEach(() => start.mockReset().mockResolvedValue({ pairingId: 'pair', tabKey: new Uint8Array(32), sessionId: null, expiresAt: 1 }))

  it('starts a same-origin pairing and announces that it is pending', async () => {
    const wrapper = mount(ThemePairingControl)
    const button = wrapper.get('button')
    expect(button.attributes('disabled')).toBeUndefined()
    await button.trigger('click')
    expect(start).toHaveBeenCalledOnce()
    expect(wrapper.get('[role="status"]').text()).toContain('Pairing request created')
  })
})
