import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import { createDefaultThemeState } from '@/utils/foundation-defaults'

describe('App foundations', () => {
  it('enables undo and immediately updates the color editor after a color change', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const colorInput = wrapper.get('input[type="color"]')

    await colorInput.setValue('#0f766e')

    expect((colorInput.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('button[aria-label="Undo"]').attributes('disabled')).toBeUndefined()
  })

  it('exposes accessible foundation sections without replacing the preview controls', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('[data-palette-header="primary"]').trigger('click')

    expect(wrapper.get('section.foundations h2').text()).toBe('Foundations')
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
    expect(wrapper.get('section.foundations fieldset').classes()).toEqual(
      expect.arrayContaining(['grid', 'gap-4']),
    )
    expect(wrapper.get('section.foundations .foundation-row').classes()).toEqual(
      expect.arrayContaining([
        'grid',
        'grid-cols-1',
        'md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]',
      ]),
    )
  })

  it('reports explicit status when a user writes the current default value', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('[data-palette-header="primary"]').trigger('click')
    const input = wrapper.get('#primary-palette-base')

    await input.setValue('#6366f1')

    expect(wrapper.get('[data-palette-status="primary-base"]').text()).toBe('explicit')
  })

  it('shows a per-control error and does not persist an unsupported color reference', async () => {
    localStorage.clear()
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const input = wrapper.get('#sidebar-surface')

    await input.setValue('var(--not-a-tailwind-color)')

    expect(wrapper.get('[role="alert"][data-foundation-error="surfaces.sidebar.light"]').text()).toContain('Unsupported color reference')
    expect(localStorage.getItem('ftb-theme')).toBeNull()
  })

  it('clears only the matching validation error when that foundation is reset', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const sidebar = wrapper.get('#sidebar-surface')
    const page = wrapper.get('#page-surface')

    await sidebar.setValue('var(--not-a-tailwind-color)')
    await page.setValue('var(--not-a-tailwind-color)')
    expect(sidebar.attributes('aria-invalid')).toBe('true')
    expect(page.attributes('aria-invalid')).toBe('true')

    await wrapper.get('button[aria-label="Reset sidebar surface"]').trigger('click')

    expect(wrapper.find('[data-foundation-error="surfaces.sidebar.light"]').exists()).toBe(false)
    expect(sidebar.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[data-foundation-error="surfaces.page.light"]').exists()).toBe(true)
    expect(page.attributes('aria-invalid')).toBe('true')
  })
})
