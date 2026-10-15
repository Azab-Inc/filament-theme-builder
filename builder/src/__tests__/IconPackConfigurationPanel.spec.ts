import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import IconPackConfigurationPanel from '../components/IconPackConfigurationPanel.vue'
import { ICON_PACK_NAMES, RESOURCE_ICON_KEYS, type IconPackConfiguration } from '../models/icons.model'

describe('IconPackConfigurationPanel', () => {
  it('preserves icon controls, preview/reset behavior, and export/reset events', async () => {
    const configuration: IconPackConfiguration = { pack: 'default', overrides: { products: 'heroicon-o-star' } }
    const previews = Object.fromEntries(RESOURCE_ICON_KEYS.map((key) => [key, `preview-${key}`])) as Record<typeof RESOURCE_ICON_KEYS[number], string>
    const wrapper = mount(IconPackConfigurationPanel, {
      props: { active: true, configuration, packNames: ICON_PACK_NAMES, resourceKeys: RESOURCE_ICON_KEYS, iconOptions: ['heroicon-o-star'], previews },
    })

    expect(wrapper.get('#editor-panel-icons[role="tabpanel"][aria-labelledby="editor-tab-icons"][data-editor-section="icons"]')).toBeTruthy()
    expect(wrapper.get('#icons-heading').text()).toBe('Icons')
    expect(wrapper.get('#icon-pack').element).toHaveProperty('value', 'default')
    expect(wrapper.get('#products-semantic-icon').element).toHaveProperty('value', 'heroicon-o-star')
    expect(wrapper.get('.icon-control-row [role="status"]').text()).toBe('preview-products')
    expect(wrapper.get('#products-semantic-icon option').text()).toContain('preview-products')

    await wrapper.get('#icon-pack').setValue('solid')
    expect(wrapper.emitted('changePack')).toContainEqual(['solid'])
    await wrapper.get('#products-semantic-icon').setValue('')
    expect(wrapper.emitted('changeOverride')).toContainEqual([{ key: 'products', value: '' }])
    await wrapper.get('[aria-label="Reset products semantic icon"]').trigger('click')
    await wrapper.get('[aria-label="Reset icon configuration"]').trigger('click')
    expect(wrapper.emitted('resetOverride')).toContainEqual(['products'])
    expect(wrapper.emitted('resetConfiguration')).toHaveLength(1)
    wrapper.unmount()
  })
})
