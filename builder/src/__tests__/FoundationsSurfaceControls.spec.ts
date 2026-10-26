import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import FoundationsSurfaceControls from '@/components/FoundationsSurfaceControls.vue'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

describe('FoundationsSurfaceControls', () => {
  it('preserves the surfaces fieldset markup, control order, status, errors, and actions', async () => {
    const foundation = createDefaultFoundationState()
    const wrapper = mount(FoundationsSurfaceControls, {
      props: {
        activeMode: 'light',
        surfaces: {
          page: foundation.surfaces.page.light,
          sidebar: foundation.surfaces.sidebar.light,
          topbar: foundation.surfaces.topbar.light,
          card: foundation.surfaces.card.light,
          elevated: foundation.surfaces.elevated.light,
          input: foundation.surfaces.input.light,
        },
        borders: {
          default: foundation.borders.default.light,
          strong: foundation.borders.strong.light,
        },
        text: {
          primary: foundation.text.primary.light,
          muted: foundation.text.muted.light,
          disabled: foundation.text.disabled.light,
        },
        surfaceNames: ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'],
        borderNames: ['default', 'strong'],
        textNames: ['primary', 'muted', 'disabled'],
        statusFor: (path: string) => path === 'surfaces.page' ? 'explicit' : 'inherited',
        foundationError: (path: string) => path === 'surfaces.page.light' ? 'Invalid color' : undefined,
      },
    })

    expect(wrapper.element.tagName).toBe('FIELDSET')
    expect(wrapper.get('legend').text()).toBe('Surfaces, borders, text, and modes')
    expect(wrapper.findAll('.color-field__text-label').map((label) => label.text())).toEqual([
      'page surface light', 'sidebar surface light', 'topbar surface light',
      'card surface light', 'elevated surface light', 'input surface light',
      'border default light', 'border strong light',
      'text primary light', 'text muted light', 'text disabled light',
    ])
    expect(wrapper.get('#page-surface').attributes('aria-invalid')).toBe('true')
    expect(wrapper.get('[data-foundation-error="surfaces.page.light"]').text()).toBe('Invalid color')
    expect(wrapper.get('#surface-page-status').text()).toBe('explicit')
    expect(wrapper.find('[aria-label="Reset page surface"]').exists()).toBe(true)

    await wrapper.get('[aria-label="Reset border default light"]').trigger('click')

    expect(wrapper.emitted('reset')?.[0]).toEqual(['borders.default.light'])
  })
})
