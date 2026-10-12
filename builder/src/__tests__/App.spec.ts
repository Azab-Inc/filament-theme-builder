import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import ThrowawayThemePrototype from '../components/ThrowawayThemePrototype.vue'

describe('App', () => {
  it('passes the supplied demo URL to the prototype iframe and gives it explicit height', () => {
    const previewUrl = 'http://127.0.0.1:4174/demo/admin'
    const wrapper = mount(ThrowawayThemePrototype, {
      props: { initialVariant: 'C', previewUrl },
    })
    const iframe = wrapper.get('iframe')

    expect(iframe.attributes('src')).toBe(previewUrl)
    expect(iframe.attributes('style')).toContain('height: 100%')

    wrapper.unmount()
  })

  it('embeds the public Filament preview and reserves a subtle notice area', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
    expect(wrapper.find('[data-demo-notice]').exists()).toBe(true)
    expect(wrapper.get('input[type="color"]').attributes('aria-label')).toBe('Primary color')
    expect(wrapper.find('button[aria-label="Undo"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Redo"]').exists()).toBe(true)
  })

  it('shows the throwaway prototype only when explicitly requested', () => {
    window.history.replaceState({}, '', '/?prototype=1&variant=B')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.find('[data-prototype="B"]').exists()).toBe(true)
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('keeps the normal editor layout when prototype mode is absent', () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.find('[data-prototype]').exists()).toBe(false)
    expect(wrapper.find('section.foundations').exists()).toBe(true)
  })

  it('switches prototype variants with controls and arrow keys while updating the URL', async () => {
    window.history.replaceState({}, '', '/?prototype=1&variant=A')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Next variant"]').trigger('click')
    expect(wrapper.find('[data-prototype="B"]').exists()).toBe(true)
    expect(window.location.search).toContain('variant=B')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-prototype="C"]').exists()).toBe(true)
    expect(window.location.search).toContain('variant=C')
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('enables undo and immediately updates the color editor after a color change', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const colorInput = wrapper.get('input[type="color"]')

    await colorInput.setValue('#0f766e')

    expect((colorInput.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('button[aria-label="Undo"]').attributes('disabled')).toBeUndefined()
  })

  it('exposes accessible foundation sections without replacing the preview controls', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('h2').text()).toBe('Foundations')
    expect(wrapper.get('input[aria-label="primary shade 500 override"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Light mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('select[aria-label="Density"], select#density')).toBeTruthy()
    expect(wrapper.get('#body-font-name')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Reset radius"]')).toBeTruthy()
    expect(wrapper.get('#spacing-1')).toBeTruthy()
    expect(wrapper.get('#border-default-light')).toBeTruthy()
    expect(wrapper.get('#border-strong-light')).toBeTruthy()
    expect(wrapper.get('#text-primary-light')).toBeTruthy()
    expect(wrapper.get('#text-muted-light')).toBeTruthy()
    expect(wrapper.get('#text-disabled-light')).toBeTruthy()
    expect(wrapper.get('#body-font-kind')).toBeTruthy()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('label button').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
  })

  it('uses a responsive grid foundation layout contract', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('section.foundations').classes()).toEqual(
      expect.arrayContaining(['grid', 'gap-4']),
    )
    expect(wrapper.get('fieldset').classes()).toEqual(
      expect.arrayContaining(['grid', 'gap-4']),
    )
    expect(wrapper.get('.foundation-row').classes()).toEqual(
      expect.arrayContaining([
        'grid',
        'grid-cols-1',
        'md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]',
      ]),
    )
  })

  it('reports inherited status when a user writes the current default value', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const input = wrapper.get('#primary-palette-base')

    await input.setValue('#6366f1')

    expect(input.element.nextElementSibling?.textContent).toBe('inherited')
  })

  it('keeps typography as names-only state and supports density and mode controls', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('#body-font-name').setValue('Editorial Sans')
    await wrapper.get('button[aria-label="Dark mode"]').trigger('click')
    await wrapper.get('button[aria-label="Compact density"]').trigger('click')

    expect(wrapper.get('#body-font-name').element).toHaveProperty('value', 'Editorial Sans')
    expect(wrapper.get('button[aria-label="Dark mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('#density').element).toHaveProperty('value', 'compact')
  })

  it('renders every exposed foundation control with an individual reset', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('button[aria-label="Light mode"]').trigger('click')

    for (const control of [
      'primary palette base',
      'success palette base',
      'warning palette base',
      'danger palette base',
      'info palette base',
      'gray palette base',
      'density',
      'spacing 1',
      'border default light',
      'border strong light',
      'text primary light',
      'text muted light',
      'text disabled light',
      'page surface',
      'body font',
      'radius',
      'border width',
      'shadow',
    ]) {
      expect(wrapper.find(`[aria-label="Reset ${control}"]`).exists(), control).toBe(true)
    }
  })
})
