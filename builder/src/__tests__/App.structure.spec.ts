import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App structure', () => {
  it('keeps the builder DOM hooks used by accessibility, automation, and preview tools', () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('iframe[title="Filament preview"]')).toBeTruthy()
    expect(wrapper.get('[data-editor-workspace] [data-editor-panel][aria-label="Editor panel"]')).toBeTruthy()
    expect(wrapper.get('[data-editor-navigation]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="foundations"]#editor-panel-foundations[role="tabpanel"][aria-labelledby="editor-tab-foundations"]')).toBeTruthy()
    expect(wrapper.get('[role="status"][aria-label="Inspector status"][data-inspector-status]')).toBeTruthy()
    expect(wrapper.get('#density')).toBeTruthy()
    expect(wrapper.get('#body-font-name')).toBeTruthy()
    expect(wrapper.get('#spacing-1-5')).toBeTruthy()
    expect(wrapper.get('[aria-label="Upload light logo"]')).toBeTruthy()
    expect(wrapper.get('[data-editor-target="form.product-name"]')).toBeTruthy()

    wrapper.unmount()
  })

  it('renders typography and layout foundations through the extracted editor control boundary', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const controls = wrapper.findComponent({ name: 'FoundationsTypographyLayoutControls' })

    expect(controls.exists()).toBe(true)
    expect(controls.findAll('fieldset legend').map((legend) => legend.text())).toEqual([
      'Typography',
      'Layout foundations',
    ])
    expect(controls.findAll('input, select').map((control) => control.attributes('id'))).toEqual([
      'body-font-kind', 'body-font-name',
      'heading-font-kind', 'heading-font-name',
      'mono-font-kind', 'mono-font-name',
      'density',
      'spacing-0', 'spacing-1', 'spacing-2', 'spacing-3', 'spacing-4',
      'spacing-6', 'spacing-8', 'spacing-px', 'spacing-0-5', 'spacing-1-5',
      'radius', 'border-width', 'shadow',
    ])
    expect(wrapper.get('#body-font-kind').attributes('aria-label')).toBe('body font type')
    expect(wrapper.get('#body-font-name').attributes('aria-label')).toBe('body font name')
    expect(wrapper.get('#spacing-0-5').attributes('type')).toBe('number')
    expect((wrapper.get('#spacing-0-5').element as HTMLInputElement).value).toBe('2')
    expect(wrapper.get('#density').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('[role="group"][aria-label="Density presets"]')).toBeTruthy()
    expect(wrapper.get('#radius').element).toHaveProperty('value', 'md')
    expect(wrapper.get('#border-width').attributes('min')).toBe('0')
    expect(wrapper.get('#shadow').element).toHaveProperty('value', 'sm')
    expect(wrapper.get('[aria-label="Reset spacing 0.5"]').text()).toBe('Reset')
    wrapper.unmount()
  })

  it('renders semantic and advanced Inspector controls through dedicated component boundaries', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.findComponent({ name: 'SemanticComponentControls' }).exists()).toBe(true)

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
        target: { candidateSelectors: ['.fi-btn'], classNames: ['fi-btn'] },
      },
    }))
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'AdvancedRawInspector' }).exists()).toBe(true)
    wrapper.unmount()
  })
})
