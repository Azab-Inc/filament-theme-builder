import { afterEach, describe, expect, it } from 'vitest'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { mountPaletteControls } from './fixtures/palette-controls'

describe('palette accordion accessibility', () => {
  afterEach(() => { document.body.innerHTML = '' })
  it('renders six collapsed headers with no shade editors until expansion', () => {
    const wrapper = mountPaletteControls()
    const headers = wrapper.findAll('[data-palette-header]')
    expect(headers.map(header => header.get('.palette-accordion__name').text())).toEqual([...PALETTE_NAMES])
    expect(headers).toHaveLength(6)
    headers.forEach(header => expect(header.attributes('aria-expanded')).toBe('false'))
    expect(wrapper.findAll('[data-palette-panel]')).toHaveLength(0)
    expect(wrapper.findAll('input[aria-label$="override"]')).toHaveLength(0)
    wrapper.unmount()
  })

  it('opens a named controlled region with all eleven original shade labels and base IDs', async () => {
    const wrapper = mountPaletteControls()
    const header = wrapper.get('[data-palette-header="primary"]')
    await header.trigger('click')
    expect(header.attributes('aria-expanded')).toBe('true')
    const panel = wrapper.get(`#${header.attributes('aria-controls')}`)
    expect(header.attributes('id')).toBeTruthy()
    expect(panel.attributes('role')).toBe('region')
    expect(panel.attributes('aria-labelledby')).toBe(header.attributes('id'))
    expect(panel.attributes('data-palette-panel')).toBe('primary')
    expect(panel.find('#primary-palette-base-picker[type="color"]').exists()).toBe(true)
    expect(panel.find('#primary-palette-base[type="text"]').exists()).toBe(true)
    expect(panel.findAll('input[aria-label$="override"]').map(input => input.attributes('aria-label')))
      .toEqual(PALETTE_SHADES.map(shade => `primary shade ${shade} override`))
    wrapper.unmount()
  })

  it('opens Success, closes Primary and retains focus after click activation', async () => {
    const wrapper = mountPaletteControls()
    const primary = wrapper.get('[data-palette-header="primary"]')
    const success = wrapper.get('[data-palette-header="success"]')
    await primary.trigger('click')
    ;(success.element as HTMLButtonElement).focus()
    await success.trigger('click')
    expect(primary.attributes('aria-expanded')).toBe('false')
    expect(success.attributes('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(success.element)
    wrapper.unmount()
  })
})
