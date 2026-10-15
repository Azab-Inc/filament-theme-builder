import { describe, expect, it } from 'vitest'

import { mount } from '@vue/test-utils'

import FoundationsTypographyLayoutControls from '@/components/FoundationsTypographyLayoutControls.vue'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'

describe('FoundationsTypographyLayoutControls', () => {
  it('preserves typography and layout markup, ordering, values, and emitted events', async () => {
    const foundation = createDefaultFoundationState()
    const wrapper = mount(FoundationsTypographyLayoutControls, {
      props: {
        typography: foundation.typography,
        spacing: foundation.spacing,
        density: foundation.density,
        radius: foundation.radius,
        borderWidth: foundation.borderWidth,
        shadow: foundation.shadow,
        fontChoices: [
          { value: 'system', label: 'System', font: { kind: 'system', name: 'System', family: 'sans-serif' } },
          { value: 'custom', label: 'Custom family' },
        ],
        statusFor: (path: string) => path === 'typography.body' ? 'explicit' : 'inherited',
      },
    })

    expect(wrapper.findAll('legend').map((legend) => legend.text())).toEqual(['Typography', 'Layout foundations'])
    expect(wrapper.findAll('label').map((label) => label.text())).toEqual([
      'body font type', 'body font name', 'heading font type', 'heading font name',
      'mono font type', 'mono font name', 'Density', ...Object.keys(foundation.spacing).map((key) => `Spacing ${key}`),
      'Radius', 'Border width', 'Shadow',
    ])
    expect(wrapper.get('#body-font-kind').attributes('aria-label')).toBe('body font type')
    expect(wrapper.get('#body-font-name').attributes('value')).toBe(foundation.typography.body.name)
    expect(wrapper.get('[role="status"]').text()).toBe('explicit')
    expect(wrapper.get('#spacing-1-5').attributes('value')).toBe(String(foundation.spacing['1.5']))
    expect(wrapper.get('.foundation-row').classes()).toContain('foundation-row')

    await wrapper.get('#body-font-name').setValue('Inter, sans-serif')
    await wrapper.get('#density').setValue('spacious')
    await wrapper.get('#spacing-1-5').setValue('1.75')
    await wrapper.get('#border-width').setValue('2')
    await wrapper.get('[aria-label="Compact density"]').trigger('click')
    await wrapper.get('[aria-label="Reset body font"]').trigger('click')

    expect(wrapper.emitted('set-font-name')?.[0]?.[0]).toMatchObject({ name: 'body' })
    expect(wrapper.emitted('set-density')).toEqual([['spacious'], ['compact']])
    expect(wrapper.emitted('set-number-foundation')?.map(([change]) => change)).toHaveLength(2)
    expect(wrapper.emitted('reset')?.[0]).toEqual(['typography.body'])
  })
})
