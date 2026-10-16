import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import HoverInspectPrototype from '../components/HoverInspectPrototype.vue'

describe('HoverInspectPrototype accessibility', () => {
  it('preserves prototype landmarks, target keyboard access, variant ARIA, and anchored positioning', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'B' } })

    expect(wrapper.get('main.inspect').classes()).toContain('inspect--b')
    expect(wrapper.find('[aria-label="Throwaway inspection workspace"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Same-origin mock Filament demo"]').exists()).toBe(true)
    expect(wrapper.get('[data-inspect-target="widget"]').attributes('tabindex')).toBe('0')
    expect(wrapper.get('[aria-label="Variant B"]').attributes('aria-current')).toBe('true')
    await wrapper.get('[data-inspect-target="widget"]').trigger('mouseenter')
    expect(wrapper.get('.inspect__details').classes()).toContain('inspect__details--anchored')

    await wrapper.get('[aria-label="Variant C"]').trigger('click')
    expect(wrapper.get('main.inspect').classes()).toContain('inspect--c')
    expect(wrapper.find('.inspect__details').exists()).toBe(false)
    expect(wrapper.find('[aria-label="Inspection prototype variants"]').exists()).toBe(true)
    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('delays hover inspection with auto-scroll off and keeps variants shareable', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'B' } })
    await wrapper.get('label.inspect__auto-scroll input').setValue(false)
    await wrapper.get('[data-inspect-target="card"]').trigger('mouseenter')
    expect(wrapper.find('[data-inspector-details]').exists()).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 220))
    expect(wrapper.get('[data-inspector-details]').text()).toContain('Recent orders card')

    await wrapper.get('button[aria-label="Variant C"]').trigger('click')
    expect(wrapper.attributes('data-hover-inspect-prototype')).toBe('C')
    expect(window.location.search).toContain('inspect=1')
    expect(window.location.search).toContain('variant=C')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('data-hover-inspect-prototype')).toBe('B')
    expect(window.location.search).toContain('variant=B')
    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

})
