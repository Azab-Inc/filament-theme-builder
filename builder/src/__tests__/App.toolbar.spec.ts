import { describe, it, expect } from 'vitest'
import { createPinia } from 'pinia'

import { mount } from '@vue/test-utils'
import EditorToolbar from '../components/EditorToolbar.vue'

describe('App toolbar', () => {
  it('keeps the editor toolbar public hooks and forwards export and recovery actions', async () => {
    const wrapper = mount(EditorToolbar, {
      global: { plugins: [createPinia()] },
      props: {
        primaryColor: '#6366f1',
        canUndo: false,
        canRedo: true,
        inspectorEnabled: true,
        inspectorStatus: 'Product name input',
        exportStatus: 'Vanilla CSS copied to clipboard.',
        runtimeLoading: true,
        legacyRecoveryAvailable: true,
        legacyRecoveryError: 'Archive needs review',
        activeMode: 'light',
      },
    })

    for (const name of [
      'Save theme', 'Export theme JSON', 'Copy vanilla CSS', 'Download vanilla CSS',
      'Export PanelProvider icon config', 'Export panel branding JSON',
      'Export PanelProvider branding config', 'Undo', 'Redo', 'Inspector',
      'Restore legacy customization', 'Download archived legacy JSON',
    ]) {
      expect(wrapper.get(`[aria-label="${name}"]`)).toBeTruthy()
    }
    expect(wrapper.get('[data-editor-header-controls]')).toBeTruthy()
    expect(wrapper.findAll('[data-toolbar-menu]')).toHaveLength(2)
    expect(wrapper.get('[data-export-status]').text()).toBe('Vanilla CSS copied to clipboard.')
    expect(wrapper.get('[data-inspector-status]').text()).toBe('Product name input')
    expect(wrapper.get('[data-preview-loading]').text()).toBe('Refreshing runtime preview…')
    expect(wrapper.get('[role="alert"].legacy-recovery').text()).toContain('Archive needs review')
    expect((wrapper.get('[aria-label="Undo"]').element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.get('[aria-label="Inspector"]').attributes('aria-pressed')).toBe('true')

    const actionButtons = {
        save: 'Save theme',
        exportCanonicalJson: 'Export theme JSON',
        copyVanillaThemeCss: 'Copy vanilla CSS',
        exportVanillaThemeCss: 'Download vanilla CSS',
        exportIconPhp: 'Export PanelProvider icon config',
        exportBrandingJson: 'Export panel branding JSON',
        exportBrandingPhp: 'Export PanelProvider branding config',
        undo: 'Undo',
        redo: 'Redo',
        toggleInspector: 'Inspector',
        restoreLegacyRecovery: 'Restore legacy customization',
        downloadLegacyRecovery: 'Download archived legacy JSON',
      } as const
    await wrapper.setProps({ canUndo: true, legacyRecoveryError: undefined })
    for (const [action, accessibleName] of Object.entries(actionButtons)) {
      await wrapper.get(`[aria-label="${accessibleName}"]`).trigger('click')
      expect(wrapper.emitted(action)).toHaveLength(1)
    }

    wrapper.unmount()
  })
})
