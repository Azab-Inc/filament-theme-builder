import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FoundationsSurfaceControls from '@/components/FoundationsSurfaceControls.vue'
import SemanticComponentControls from '@/components/SemanticComponentControls.vue'
import { componentColorRows, modeColorProps } from './fixtures/color-control-props'

describe('existing color field inventory', () => {
  for (const mode of ['light', 'dark'] as const) {
    it(`offers both methods for all 11 ${mode} surface/border/text values`, () => {
      const wrapper = mount(FoundationsSurfaceControls, { props: { ...modeColorProps(), activeMode: mode } })
      const fields = wrapper.findAll('[data-color-field]')
      expect(fields).toHaveLength(11)
      for (const field of fields) {
        expect(field.find('input[type="color"]').exists()).toBe(true)
        expect(field.find('button[aria-label$="from Tailwind palette"]').exists()).toBe(true)
        const id = field.attributes('data-color-field')
        expect(field.find(`input[id="${id}"]`).exists()).toBe(true)
      }
      wrapper.unmount()
    })
  }

  it('covers every existing semantic component scope', () => {
    const wrapper = mount(SemanticComponentControls, { props: { rows: componentColorRows() } })
    expect(wrapper.findAll('[data-color-field]')).toHaveLength(4)
    for (const scope of ['global', 'component', 'variant', 'state']) {
      const field = wrapper.get(`[data-color-field="product-name-${scope}-background"]`)
      expect(field.get('input[type="color"]').element.tagName).toBe('INPUT')
      expect(field.get('button[aria-label$="from Tailwind palette"]').element.tagName).toBe('BUTTON')
    }
    wrapper.unmount()
  })
})
