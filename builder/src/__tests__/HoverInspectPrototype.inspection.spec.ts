import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import HoverInspectPrototype from '../components/HoverInspectPrototype.vue'

describe('HoverInspectPrototype inspection', () => {
  it('mounts the hover inspector only behind the inspect query gate', () => {
    window.history.replaceState({}, '', '/?inspect=1&variant=B')
    const inspected = mount(App, { global: { plugins: [createPinia()] } })

    expect(inspected.find('[data-hover-inspect-prototype="B"]').exists()).toBe(true)
    expect(inspected.find('[data-prototype]').exists()).toBe(false)
    inspected.unmount()

    window.history.replaceState({}, '', '/?variant=B')
    const normal = mount(App, { global: { plugins: [createPinia()] } })
    expect(normal.find('[data-hover-inspect-prototype]').exists()).toBe(false)
    expect(normal.get('section.foundations')).toBeTruthy()
    normal.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('models mapped, unmapped, pinned, and keyboard inspection in the prototype', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'A' } })
    const widget = wrapper.get('[data-inspect-target="widget"]')

    await widget.trigger('mouseenter')
    await new Promise((resolve) => setTimeout(resolve, 220))
    expect(wrapper.get('[data-inspector-details]').text()).toContain('Dashboard stats widget')
    expect(wrapper.get('[data-editor-highlight]').attributes('data-editor-highlight')).toBe('widgets.stats')

    await widget.trigger('click')
    await widget.trigger('mouseleave')
    expect(wrapper.get('[data-inspector-details]').text()).toContain('PINNED INSPECTION')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    await wrapper.get('[data-inspect-target="unmapped"]').trigger('mouseenter')
    await new Promise((resolve) => setTimeout(resolve, 220))
    expect(wrapper.get('[data-inspector-details]').text()).toContain('Detected, but not mapped')
    expect(wrapper.get('[data-inspector-details]').text()).toContain('No editor section is linked')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-inspector-details]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('switches navigation orientation inside the editor without changing the demo pane', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'A' } })
    const demo = wrapper.get('.inspect__demo')
    const demoMarkup = demo.element.innerHTML
    const navigation = wrapper.get('.inspect__editor-nav')

    expect(navigation.classes()).toContain('inspect__editor-nav--vertical')
    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('Sidebar')
    expect(wrapper.get('.inspect__workspace').element.children).toHaveLength(2)

    await wrapper.get('button[aria-pressed="false"]').trigger('click')

    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('Top navigation')
    expect(wrapper.get('.inspect__editor-nav').classes()).toContain('inspect__editor-nav--horizontal')
    expect(wrapper.get('.inspect__demo').classes()).toEqual(['inspect__demo'])
    expect(wrapper.get('.inspect__demo').element.innerHTML).toBe(demoMarkup)
    expect(wrapper.get('.inspect__workspace').element.children).toHaveLength(2)
    expect(wrapper.get('.inspect__editor').element.nextElementSibling).toBe(wrapper.get('.inspect__demo-wrap').element)
    wrapper.unmount()
  })
})
