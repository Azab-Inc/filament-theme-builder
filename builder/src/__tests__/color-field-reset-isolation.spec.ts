import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FoundationsSurfaceControls from '@/components/FoundationsSurfaceControls.vue'
import SemanticComponentControls from '@/components/SemanticComponentControls.vue'
import AdvancedRawInspector from '@/components/AdvancedRawInspector.vue'
import { componentColorRows, modeColorProps } from './fixtures/color-control-props'

describe('color adapter identity and reset isolation', () => {
  it('keeps one visible label/error ID and resets only the requested mode field', async () => {
    const wrapper = mount(FoundationsSurfaceControls, { props: {
      ...modeColorProps(), foundationError: path => path === 'surfaces.page.light' ? 'Invalid color' : undefined,
    } })
    expect(wrapper.findAll('label[for="page-surface"]')).toHaveLength(1)
    expect(wrapper.findAll('#surface-page-error')).toHaveLength(1)
    await wrapper.get('#page-surface').setValue('#invalid-page')
    await wrapper.get('#sidebar-surface').setValue('#invalid-sidebar')
    await wrapper.get('[aria-label="Reset page surface"]').trigger('click')
    expect((wrapper.get('#page-surface').element as HTMLInputElement).value).toBe('var(--gray-50)')
    expect((wrapper.get('#sidebar-surface').element as HTMLInputElement).value).toBe('#invalid-sidebar')
    wrapper.unmount()
  })

  it('resets an invalid semantic draft even when its canonical default did not change', async () => {
    const wrapper = mount(SemanticComponentControls, { props: { rows: componentColorRows() } })
    await wrapper.get('#product-name-global-background').setValue('#invalid')
    await wrapper.get('[aria-label="Reset Product name global background"]').trigger('click')
    expect((wrapper.get('#product-name-global-background').element as HTMLInputElement).value).toBe('#ffffff')
    expect(wrapper.findAll('label[for="product-name-global-background"]')).toHaveLength(1)
    wrapper.unmount()
  })

  it('clears raw drafts on full reset and adds no chooser to non-color properties', async () => {
    const wrapper = mount(AdvancedRawInspector, { props: {
      visible: true, selector: '.fi-btn', selectorClassification: { quality: 'stable', selector: '.fi-btn' },
      properties: ['color', 'background-color', 'border-color', 'border-width'], propertyValue: () => '',
    } })
    expect(wrapper.findAll('button[aria-label$="from Tailwind palette"]')).toHaveLength(3)
    expect(wrapper.get('#raw-border-width').element.tagName).toBe('INPUT')
    await wrapper.get('#raw-color').setValue('invalid')
    await wrapper.get('[aria-label="Reset raw element override"]').trigger('click')
    expect((wrapper.get('#raw-color').element as HTMLInputElement).value).toBe('')
    expect(wrapper.text()).not.toContain("import { ref }")
    wrapper.unmount()
  })
})
