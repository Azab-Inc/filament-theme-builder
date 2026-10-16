import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App advanced Inspector', () => {
  it('shows Advanced Inspector controls with a stable raw selector and keeps semantic controls separate', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    const iframeWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: iframeWindow })

    await wrapper.get('button[aria-label="Inspector"]').trigger('click')
    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: iframeWindow,
      data: {
        type: 'ftb:inspector:select',
        protocolVersion: 1,
        target: { candidateSelectors: ['.fi-btn.fi-primary', '.fi-btn'], classNames: ['fi-btn', 'fi-primary'] },
      },
    }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-advanced-inspector]').exists()).toBe(true)
    expect((wrapper.get('#raw-selector').element as HTMLInputElement).value).toBe('.fi-btn')
    expect(wrapper.find('[data-selector-warning]').exists()).toBe(false)
    expect(wrapper.find('[data-editor-section-button="components"]').exists()).toBe(true)

    await wrapper.get('[aria-label="Raw color"]').setValue('#0f766e')
    expect(wrapper.get('[aria-label="Raw color"]').element).toBeTruthy()
    expect(wrapper.find('[data-export-status]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clears the Inspector breadcrumb when the preview iframe navigates before re-enabling', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe')
    const iframeWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe.element, 'contentWindow', { configurable: true, value: iframeWindow })
    await wrapper.get('button[aria-label="Inspector"]').trigger('click')

    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: iframeWindow,
      data: {
        type: 'ftb:inspector:select',
        protocolVersion: 1,
        target: { candidateSelectors: ['.fi-fo-text-input .fi-input'], classNames: ['fi-input'] },
      },
    }))
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-inspector-status]').text()).toContain('Product name input')

    await iframe.trigger('load')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-inspector-status]').text()).toBe('Inspector enabled')
    wrapper.unmount()
  })
})
