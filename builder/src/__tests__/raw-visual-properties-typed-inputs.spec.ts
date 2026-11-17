import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import RawPropertyField from '@/components/RawPropertyField.vue'
import {
  composeSpacingValue,
  joinLengthValue,
  parseSpacingValue,
  splitLengthValue,
} from '@/utils/raw-property-controls'

const fontChoices = [
  { value: 'system', label: 'System', font: { kind: 'system' as const, name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' } },
  { value: 'custom', label: 'Custom family' },
]

describe('raw property typed controls', () => {
  it('splits and joins length values with a supported unit', () => {
    expect(splitLengthValue('0.75rem', ['px', 'rem'])).toEqual({ amount: '0.75', unit: 'rem' })
    expect(splitLengthValue('2', ['px', 'rem'])).toEqual({ amount: '2', unit: 'px' })
    expect(splitLengthValue('', ['px', 'rem'])).toEqual({ amount: '', unit: 'px' })
    expect(joinLengthValue('2', 'px')).toBe('2px')
    expect(joinLengthValue('', 'px')).toBe('')
  })

  it('expands and composes spacing shorthand values', () => {
    expect(parseSpacingValue('1rem')).toEqual({ amounts: ['1', '1', '1', '1'], unit: 'rem' })
    expect(parseSpacingValue('0.5rem 1rem')).toEqual({ amounts: ['0.5', '1', '0.5', '1'], unit: 'rem' })
    expect(parseSpacingValue('1px 2px 3px')).toEqual({ amounts: ['1', '2', '3', '2'], unit: 'px' })
    expect(parseSpacingValue('')).toEqual({ amounts: ['', '', '', ''], unit: 'px' })
    expect(composeSpacingValue(['1', '2', '3', '4'], 'rem')).toBe('1rem 2rem 3rem 4rem')
    expect(composeSpacingValue(['1', '', '3', '4'], 'rem')).toBe('')
  })

  it('renders a number input plus a unit select for length properties', async () => {
    const wrapper = mount(RawPropertyField, { props: { id: 'raw-border-radius', label: 'Raw border-radius', property: 'border-radius', value: '0.75rem', fontChoices } })
    const amount = wrapper.get('#raw-border-radius')
    expect(amount.attributes('type')).toBe('number')
    const unit = wrapper.get('#raw-border-radius-unit')
    expect(unit.element.tagName).toBe('SELECT')

    await amount.setValue('1.25')
    expect(wrapper.emitted('update')!.slice(-1)[0]).toEqual(['1.25rem'])

    await unit.setValue('px')
    expect(wrapper.emitted('update')!.slice(-1)[0]).toEqual(['1.25px'])
  })

  it('renders a range-limited number input for opacity', async () => {
    const wrapper = mount(RawPropertyField, { props: { id: 'raw-opacity', label: 'Raw opacity', property: 'opacity', value: '0.8', fontChoices } })
    const input = wrapper.get('#raw-opacity')
    expect(input.attributes('type')).toBe('number')
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('1')

    await input.setValue('0.4')
    expect(wrapper.emitted('update')!.slice(-1)[0]).toEqual(['0.4'])
  })

  it('renders selects for enumerated properties instead of text inputs', () => {
    for (const [property, expected] of [
      ['font-weight', '600'],
      ['text-decoration', 'underline'],
      ['border-style', 'dashed'],
      ['text-align', 'center'],
      ['white-space', 'pre-wrap'],
    ] as const) {
      const wrapper = mount(RawPropertyField, { props: { id: `raw-${property}`, label: `Raw ${property}`, property, value: expected, fontChoices } })
      const select = wrapper.get(`#raw-${property}`)
      expect(select.element.tagName).toBe('SELECT')
      expect((select.element as HTMLSelectElement).value).toBe(expected)
    }
  })

  it('renders four number inputs sharing one unit for spacing properties', async () => {
    const wrapper = mount(RawPropertyField, { props: { id: 'raw-padding', label: 'Raw padding', property: 'padding', value: '0.5rem 1rem', fontChoices } })
    expect(wrapper.get('#raw-padding').attributes('type')).toBe('number')
    for (const side of ['right', 'bottom', 'left']) {
      expect(wrapper.get(`#raw-padding-${side}`).attributes('type')).toBe('number')
    }
    expect(wrapper.get('#raw-padding').element).toHaveProperty('value', '0.5')
    expect(wrapper.get('#raw-padding-right').element).toHaveProperty('value', '1')

    await wrapper.get('#raw-padding-left').setValue('2')
    expect(wrapper.emitted('update')!.slice(-1)[0]).toEqual(['0.5rem 1rem 0.5rem 2rem'])
  })

  it('renders a font family select from the available font choices', () => {
    const wrapper = mount(RawPropertyField, { props: { id: 'raw-font-family', label: 'Raw font-family', property: 'font-family', value: 'Inter', fontChoices } })
    const select = wrapper.get('#raw-font-family')
    expect(select.element.tagName).toBe('SELECT')
    const values = [...(select.element as HTMLSelectElement).options].map((option) => option.value)
    expect(values).toContain('ui-sans-serif, system-ui, sans-serif')
    expect(values).toContain('Inter')
  })

  it('keeps an existing unknown value selectable instead of dropping it', () => {
    const wrapper = mount(RawPropertyField, { props: { id: 'raw-border-style', label: 'Raw border-style', property: 'border-style', value: 'groove', fontChoices } })
    const select = wrapper.get('#raw-border-style') as ReturnType<typeof wrapper.get>
    expect((select.element as HTMLSelectElement).value).toBe('groove')
  })
})
