import { afterEach, describe, expect, it } from 'vitest'
import { mountPaletteControls } from './fixtures/palette-controls'

describe('FoundationsPaletteControls actions', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('preserves fieldset hooks and exact typed palette actions', async () => {
    const wrapper = mountPaletteControls()
    expect(wrapper.get('fieldset').classes()).toEqual(['grid', 'gap-4', 'rounded-lg', 'border', 'border-zinc-200', 'p-4'])
    expect(wrapper.get('legend').text()).toBe('Color palettes')
    await wrapper.get('[data-palette-header="primary"]').trigger('click')
    expect((wrapper.get('#primary-palette-base').element as HTMLInputElement).value).toBe('#6366f1')
    expect(wrapper.get('#primary-shade-50').attributes('aria-label')).toBe('primary shade 50 override')
    expect(wrapper.get('[role="status"]').text()).toBe('explicit')
    await wrapper.get('#primary-palette-base').setValue('#123456')
    await wrapper.get('#primary-shade-50').setValue('#abcdef')
    await wrapper.get('[aria-label="Reset primary palette base"]').trigger('click')
    await wrapper.get('[aria-label="Reset primary shade 50"]').trigger('click')
    expect(wrapper.emitted('set-palette-base')).toEqual([[{ name: 'primary', value: '#123456' }]])
    expect(wrapper.emitted('set-palette-shade')).toEqual([[{ name: 'primary', shade: 50, value: '#abcdef' }]])
    expect(wrapper.emitted('reset-palette-base')).toEqual([['primary']])
    expect(wrapper.emitted('reset-palette-shade')).toEqual([[{ name: 'primary', shade: 50 }]])
    wrapper.unmount()
  })

  it('associates status with the base text, picker and shade controls', async () => {
    const wrapper = mountPaletteControls()
    await wrapper.get('[data-palette-header="primary"]').trigger('click')
    const baseStatus = wrapper.get('[data-palette-status="primary-base"]')
    const shadeStatus = wrapper.get('[data-palette-status="primary-shade-50"]')
    expect(wrapper.get('#primary-palette-base').attributes('aria-describedby')).toBe(baseStatus.attributes('id'))
    expect(wrapper.get('#primary-palette-base-picker').attributes('aria-describedby')?.split(' ')).toContain(baseStatus.attributes('id'))
    expect(wrapper.get('#primary-palette-base-picker').attributes('aria-describedby')?.split(' ')).toContain('primary-palette-base-label')
    expect(wrapper.get('#primary-shade-50').attributes('aria-describedby')).toBe(shadeStatus.attributes('id'))
    expect(baseStatus.text()).toBe('explicit')
    expect(shadeStatus.text()).toBe('generated')
    wrapper.unmount()
  })
})
