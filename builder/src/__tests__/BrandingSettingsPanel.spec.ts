import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BrandingSettingsPanel from '../components/BrandingSettingsPanel.vue'
import { createDefaultPanelBrandingSettings } from '../utils/panel-branding-validation'

describe('BrandingSettingsPanel', () => {
  it('preserves the branding controls, accessibility hooks, order, and callback payloads', async () => {
    const wrapper = mount(BrandingSettingsPanel, {
      props: {
        active: true,
        branding: createDefaultPanelBrandingSettings(),
        uploadErrors: { lightLogo: 'Upload rejected' },
      },
    })

    expect(wrapper.get('#editor-panel-branding[role="tabpanel"][aria-labelledby="editor-tab-branding"][data-editor-section="branding"]')).toBeTruthy()
    expect(wrapper.get('#branding-heading').text()).toBe('Panel branding and runtime')
    expect(wrapper.findAll('fieldset > :is(legend, label, input, select, button, span)').map((node) => node.attributes('id') ?? node.text().trim()).slice(0, 6)).toEqual([
      'PanelBrandingSettings', 'App name', 'brand-app-name', 'Light logo upload reference', 'brand-light-logo-file', 'brand-light-logo',
    ])
    expect(wrapper.get('[aria-label="Upload light logo"]').attributes('accept')).toBe('image/jpeg,image/png,image/webp')
    expect(wrapper.get('[role="alert"]').text()).toBe('Upload rejected')
    expect(wrapper.get('#brand-content-width option').text()).toBe('sm')
    expect(wrapper.get('#brand-sidebar option').text()).toBe('Collapsible')

    await wrapper.get('#brand-app-name').setValue('Acme')
    expect(wrapper.emitted('changeBranding')).toContainEqual([{ setting: 'appName', value: 'Acme' }])
    await wrapper.get('#brand-light-logo-file').trigger('change')
    expect(wrapper.emitted('uploadAsset')).toHaveLength(1)
    await wrapper.get('[aria-label="Reset panel branding"]').trigger('click')
    expect(wrapper.emitted('resetBranding')).toHaveLength(1)
    wrapper.unmount()
  })
})
