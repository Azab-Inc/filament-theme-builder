import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App Inspector accessibility', () => {
  it('exposes an accessible Inspector toggle and breadcrumb status without changing the iframe URL', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe')
    const src = iframe.attributes('src')

    expect(wrapper.get('button[aria-label="Inspector"]').attributes('aria-pressed')).toBe('false')
    await wrapper.get('button[aria-label="Inspector"]').trigger('click')
    expect(wrapper.get('button[aria-label="Inspector"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('iframe').attributes('src')).toBe(src)
    expect(wrapper.get('[role="status"][aria-label="Inspector status"]').text()).toContain('Inspector enabled')

    wrapper.unmount()
  })

  it('marks the existing Product name control as the only inspector editor target', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('[data-editor-section-button="components"]').trigger('click')

    expect(wrapper.findAll('[data-editor-target]').map((target) => target.attributes('data-editor-target')))
      .toEqual(['form.product-name'])
  })

  it('accepts Inspector events only from the current iframe and exact preview origin', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    const iframeWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: iframeWindow })
    const send = (origin: string, source: MessageEventSource | null) => {
      const event = new MessageEvent('message', {
        origin,
        source,
        data: {
          type: 'ftb:inspector:select',
          protocolVersion: 1,
          target: { candidateSelectors: ['.fi-fo-text-input .fi-input'], classNames: ['fi-input'], targetId: 'form.product_name' },
        },
      })
      window.dispatchEvent(event)
    }

    send('https://untrusted.invalid', iframeWindow)
    expect(wrapper.get('[data-inspector-status]').text()).toBe('Inspector disabled')
    send(window.location.origin, window)
    expect(wrapper.get('[data-inspector-status]').text()).toBe('Inspector disabled')

    await wrapper.get('button[aria-label="Inspector"]').trigger('click')
    send(window.location.origin, iframeWindow)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-inspector-status]').text()).toContain('Product name input')

    wrapper.unmount()
  })

  it('surfaces a preview assignment collision as an accessible Inspector error', async () => {
    window.history.replaceState({}, '', '/')
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
        target: { candidateSelectors: ['.fi-section-header'], classNames: ['fi-section-header'], targetSelector: '.fi-section-header', matchIndex: 1 },
      },
    }))
    await wrapper.vm.$nextTick()
    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: iframeWindow,
      data: { type: 'ftb:theme:rejected', protocolVersion: 1, reason: 'Unique element ID collision with an application-owned element.' },
    }))
    await wrapper.vm.$nextTick()

    expect(wrapper.get('#unique-element-id-error').text()).toContain('collision')
    expect(wrapper.get('#unique-element-id-error').attributes('role')).toBe('alert')
    expect(wrapper.get('#unique-element-id').attributes('aria-describedby')).toBe('unique-element-id-error')

    wrapper.unmount()
  })
})
