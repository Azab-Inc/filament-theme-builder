import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'

describe('App editor lifecycle', () => {
  it('keeps layout foundation input timing and undo/reset callbacks unchanged', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const spacing = wrapper.get('#spacing-1-5')

    await spacing.setValue('7.25')

    expect((spacing.element as HTMLInputElement).value).toBe('7.25')
    expect(wrapper.get('button[aria-label="Undo"]').attributes('disabled')).toBeUndefined()
    expect(spacing.element.nextElementSibling?.textContent).toBe('live-emulation')

    await wrapper.get('button[aria-label="Undo"]').trigger('click')
    expect(wrapper.get('#spacing-1-5').element).toHaveProperty('value', '6')
    await wrapper.get('button[aria-label="Redo"]').trigger('click')
    expect(wrapper.get('#spacing-1-5').element).toHaveProperty('value', '7.25')

    await wrapper.get('[aria-label="Reset spacing 1.5"]').trigger('click')
    expect(wrapper.get('#spacing-1-5').element).toHaveProperty('value', '6')
    await wrapper.get('[aria-label="Compact density"]').trigger('click')
    expect(wrapper.get('#density').element).toHaveProperty('value', 'compact')

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('removes the window listeners it owns when the builder unmounts', () => {
    window.history.replaceState({}, '', '/')
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const ownedListeners = addListener.mock.calls.filter(([type]) => type === 'keydown' || type === 'message')

    wrapper.unmount()

    for (const [type, listener] of ownedListeners) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }
    expect(ownedListeners.map(([type]) => type)).toEqual(expect.arrayContaining(['keydown', 'message']))

    addListener.mockRestore()
    removeListener.mockRestore()
  })

  it('keeps listeners mount-local when multiple builders are mounted and disposed independently', () => {
    window.history.replaceState({}, '', '/')
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const first = mount(App, { global: { plugins: [createPinia()] } })
    const second = mount(App, { global: { plugins: [createPinia()] } })
    const firstListeners = addListener.mock.calls.filter(([type]) => type === 'keydown' || type === 'message')
    const secondListeners = firstListeners.slice(2)

    first.unmount()

    for (const [type, listener] of firstListeners.slice(0, 2)) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }
    for (const [type, listener] of secondListeners) {
      expect(removeListener).not.toHaveBeenCalledWith(type, listener)
    }

    second.unmount()

    for (const [type, listener] of secondListeners) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }

    addListener.mockRestore()
    removeListener.mockRestore()
  })
})
