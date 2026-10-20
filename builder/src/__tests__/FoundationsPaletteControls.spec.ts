import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import FoundationsPaletteControls from '@/components/FoundationsPaletteControls.vue'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

describe('FoundationsPaletteControls', () => {
  const mountControls = () =>
    mount(FoundationsPaletteControls, {
      props: {
        palettes: createDefaultFoundationState().palettes,
        paletteNames: PALETTE_NAMES,
        paletteShades: PALETTE_SHADES,
        statusFor: (path: string) => (path === 'palettes.primary.base' ? 'explicit' : 'generated'),
      },
    })

  it('preserves the palette fieldset hooks and emits typed palette actions', async () => {
    const wrapper = mountControls()
    const fieldset = wrapper.get('fieldset')
    expect(fieldset.classes()).toEqual([
      'grid',
      'gap-4',
      'rounded-lg',
      'border',
      'border-zinc-200',
      'p-4',
    ])
    expect(fieldset.get('legend').text()).toBe('Color palettes')
    expect(wrapper.get('#primary-palette-base').attributes('value')).toBe('#6366f1')
    expect(wrapper.get('#primary-shade-50').attributes('aria-label')).toBe(
      'primary shade 50 override',
    )
    expect(wrapper.get('[role="status"]').text()).toBe('explicit')
    expect(wrapper.find('[aria-label="Reset primary palette base"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Reset primary shade 50"]').exists()).toBe(true)

    await wrapper.get('#primary-palette-base').setValue('#123456')
    await wrapper.get('#primary-shade-50').setValue('#abcdef')
    await wrapper.get('[aria-label="Reset primary palette base"]').trigger('click')
    await wrapper.get('[aria-label="Reset primary shade 50"]').trigger('click')

    expect(wrapper.emitted('set-palette-base')).toEqual([[{ name: 'primary', value: '#123456' }]])
    expect(wrapper.emitted('set-palette-shade')).toEqual([
      [{ name: 'primary', shade: 50, value: '#abcdef' }],
    ])
    expect(wrapper.emitted('reset-palette-base')).toEqual([['primary']])
    expect(wrapper.emitted('reset-palette-shade')).toEqual([[{ name: 'primary', shade: 50 }]])
  })

  it('renders six named collapsed headers and keeps shade editors hidden until expanded', () => {
    const wrapper = mountControls()
    const headers = wrapper.findAll('[data-palette-header]')

    expect(headers.map((header) => header.text())).toEqual([...PALETTE_NAMES])
    expect(headers).toHaveLength(6)
    headers.forEach((header) => expect(header.attributes('aria-expanded')).toBe('false'))
    expect(wrapper.findAll('[data-palette-panel]:not([hidden])')).toHaveLength(0)
    expect(wrapper.findAll('input[aria-label$="override"]')).toHaveLength(0)
  })

  it('opens Primary with a controlled panel, base inputs, and all eleven shade labels', async () => {
    const wrapper = mountControls()
    const header = wrapper.get('[data-palette-header="primary"]')

    await header.trigger('click')

    expect(header.attributes('aria-expanded')).toBe('true')
    const headerId = header.attributes('id')
    const panelId = header.attributes('aria-controls')
    expect(headerId).toBeTruthy()
    expect(panelId).toBeTruthy()
    const panel = wrapper.get(`#${panelId}`)
    expect(panel.attributes('role')).toBe('region')
    expect(panel.attributes('aria-labelledby')).toBe(headerId)
    expect(header.attributes('aria-controls')).toBe(panel.attributes('id'))
    expect(panel.attributes('data-palette-panel')).toBe('primary')
    expect(panel.find('#primary-palette-base[type="color"]').exists()).toBe(true)
    expect(panel.find('#primary-palette-base[type="text"]').exists()).toBe(true)
    expect(panel.findAll('input[aria-label$="override"]').map((input) => input.attributes('aria-label')))
      .toEqual(PALETTE_SHADES.map((shade) => `primary shade ${shade} override`))
  })

  it('opens Success by keyboard, closes Primary, and retains focus on Success', async () => {
    const wrapper = mountControls()
    const primary = wrapper.get('[data-palette-header="primary"]')
    const success = wrapper.get('[data-palette-header="success"]')

    await primary.trigger('click')
    await success.trigger('keydown.enter')

    expect(primary.attributes('aria-expanded')).toBe('false')
    expect(success.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(success.element)
  })

  it('associates status text with its palette base and shade controls', async () => {
    const wrapper = mountControls()
    await wrapper.get('[data-palette-header="primary"]').trigger('click')

    const base = wrapper.get('#primary-palette-base[type="text"]')
    const baseStatus = wrapper.get('[data-palette-status="primary-base"]')
    const shade = wrapper.get('#primary-shade-50')
    const shadeStatus = wrapper.get('[data-palette-status="primary-shade-50"]')

    expect(base.attributes('aria-describedby')).toBe(baseStatus.attributes('id'))
    expect(baseStatus.text()).toBe('explicit')
    expect(shade.attributes('aria-describedby')).toBe(shadeStatus.attributes('id'))
    expect(shadeStatus.text()).toBe('generated')
  })
})
