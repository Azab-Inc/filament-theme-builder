import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { nextTick } from 'vue'
import { describe, expect, it } from 'vitest'
import App from '@/App.vue'
import ColorField from '@/components/ColorField.vue'
import { useThemeStore } from '@/stores/theme'
import { PALETTE_NAMES } from '@/models/foundations.model'

describe('production-composed color field inventory', () => {
  it('wires toolbar, every palette/mode, semantic scopes and raw colors without writes on opening', async () => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
    const pinia = createPinia()
    const wrapper = mount(App, { global: { plugins: [pinia] } })
    const store = useThemeStore(pinia)
    const before = JSON.stringify(store.theme)
    expect(wrapper.findAllComponents(ColorField)).toHaveLength(16)
    expect(wrapper.get('input[aria-label="Primary color"]').attributes('type')).toBe('color')
    for (const mode of ['light', 'dark']) {
      await wrapper.get(`[aria-label="${mode === 'light' ? 'Light' : 'Dark'} mode"]`).trigger('click')
      expect(wrapper.findAll('input[type="text"][id$="surface"]')).toHaveLength(6)
      expect(wrapper.findAll(`input[id^="border-"][id$="-${mode}"]`)).toHaveLength(2)
      expect(wrapper.findAll(`input[id^="text-"][id$="-${mode}"]`)).toHaveLength(3)
    }
    for (const name of PALETTE_NAMES) {
      await wrapper.get(`[data-palette-header="${name}"]`).trigger('click')
      expect(wrapper.findAllComponents(ColorField)).toHaveLength(28)
      expect(wrapper.findAll(`input[id^="${name}-shade-"][type="text"]`)).toHaveLength(11)
    }
    for (const scope of ['global', 'component', 'variant', 'state']) {
      expect(wrapper.get(`#product-name-${scope}-background`).attributes('aria-label')).toBe(`Product name ${scope} background`)
    }
    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    const frameWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: frameWindow })
    await wrapper.get('[aria-label="Inspector"]').trigger('click')
    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin, source: frameWindow,
      data: { type: 'ftb:inspector:select', protocolVersion: 1, target: { candidateSelectors: ['.fi-btn'], classNames: ['fi-btn'] } },
    }))
    await nextTick()
    expect(wrapper.findAllComponents(ColorField)).toHaveLength(31)
    for (const id of ['raw-color', 'raw-background-color', 'raw-border-color']) {
      expect(wrapper.get(`[data-color-field="${id}"] input[type="color"]`).element.tagName).toBe('INPUT')
    }
    expect(wrapper.find('[data-color-field="raw-border-width"]').exists()).toBe(false)
    for (const field of wrapper.findAllComponents(ColorField)) {
      expect(field.get('input[type="color"]').element.tagName).toBe('INPUT')
      expect(field.get('button[aria-label$="from Tailwind palette"]').element.tagName).toBe('BUTTON')
    }
    expect(JSON.stringify(store.theme)).toBe(before)
    wrapper.unmount()
    store.$dispose()
    localStorage.clear()
  })
})
