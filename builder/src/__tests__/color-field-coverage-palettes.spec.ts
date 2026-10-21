import { afterEach, describe, expect, it } from 'vitest'
import { PALETTE_NAMES } from '@/models/foundations.model'
import { mountPaletteControls } from './fixtures/palette-controls'

describe('palette color field coverage', () => {
  afterEach(() => { document.body.innerHTML = '' })
  it('offers both affordances across all six bases and 66 editable shades', async () => {
    const wrapper = mountPaletteControls()
    for (const name of PALETTE_NAMES) {
      await wrapper.get(`[data-palette-header="${name}"]`).trigger('click')
      const fields = wrapper.findAll('[data-palette-panel] [data-color-field]')
      expect(fields).toHaveLength(12)
      for (const field of fields) {
        expect(field.find('input[type="color"]').exists()).toBe(true)
        expect(field.find('button[aria-label$="from Tailwind palette"]').exists()).toBe(true)
      }
    }
    wrapper.unmount()
  })

  it('resets an invalid base draft at the canonical default without losing another shade draft', async () => {
    const wrapper = mountPaletteControls()
    await wrapper.get('[data-palette-header="primary"]').trigger('click')
    await wrapper.get('#primary-palette-base').setValue('#invalid-draft')
    await wrapper.get('#primary-shade-50').setValue('#other-invalid-draft')
    await wrapper.get('[aria-label="Reset primary palette base"]').trigger('click')
    expect((wrapper.get('#primary-palette-base').element as HTMLInputElement).value).toBe('#6366f1')
    expect((wrapper.get('#primary-shade-50').element as HTMLInputElement).value).toBe('#other-invalid-draft')
    wrapper.unmount()
  })
})
