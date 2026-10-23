import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import PaddingEdgeEditor from '@/components/PaddingEdgeEditor.vue'
import PaddingHierarchyPanel from '@/components/PaddingHierarchyPanel.vue'
import { useThemeStore } from '@/stores/theme'

describe('padding editor UI', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows mixed linked edges without changing them when linking', async () => {
    const wrapper = mount(PaddingEdgeEditor, { props: { linked: false, contextKey: 'test', contextLabel: 'Test', edges: { top: '6px', right: '12px', bottom: '6px', left: '12px' } } })
    await wrapper.get('button[aria-label="Link all edges"]').trigger('click')
    expect(wrapper.emitted('set')).toBeUndefined()
    expect(wrapper.text()).toContain('Mixed')
  })

  it('emits one atomic linked mutation and preserves separate editing', async () => {
    const wrapper = mount(PaddingEdgeEditor, { props: { linked: true, contextKey: 'test', contextLabel: 'Test', edges: { top: '6px', right: '12px', bottom: '6px', left: '12px' } } })
    await wrapper.get('input[aria-label="Test linked padding"]').setValue('8')
    await wrapper.get('button[aria-label="Test apply linked padding"]').trigger('click')
    expect(wrapper.emitted('set')?.[0]).toEqual([{ top: '8px', right: '8px', bottom: '8px', left: '8px' }])
  })

  it('combines the numeric value with the selected CSS unit', async () => {
    const wrapper = mount(PaddingEdgeEditor, { props: { linked: true, contextKey: 'test', contextLabel: 'Test', edges: { top: null, right: null, bottom: null, left: null } } })
    await wrapper.get('input[aria-label="Test linked padding"]').setValue('54')
    await wrapper.get('select[aria-label="Test linked padding unit"]').setValue('rem')
    await wrapper.get('button[aria-label="Test apply linked padding"]').trigger('click')
    expect(wrapper.emitted('set')?.[0]).toEqual([{ top: '54rem', right: '54rem', bottom: '54rem', left: '54rem' }])
  })

  it('renders registry rows and delegates mutations to the store', async () => {
    const store = useThemeStore()
    const wrapper = mount(PaddingHierarchyPanel, { props: { targets: [{ id: 'forms.input', sectionId: 'forms', targetKind: 'leaf', status: 'supported', units: ['px'], variants: [], states: [] }], read: store.readPadding, set: store.setPadding, reset: store.resetPadding } })
    expect(wrapper.text()).toContain('forms.input')
    await wrapper.get('[data-padding-context="forms.input-component"] button[aria-label="Reset Component forms.input padding"]').trigger('click')
    expect(store.theme.padding).toEqual([])
  })

  it('renders editable global, section, and component contexts for leaf targets', async () => {
    const store = useThemeStore()
    const target = { id: 'forms.input', sectionId: 'forms', targetKind: 'leaf' as const, status: 'supported' as const, units: ['px'], variants: [], states: [] }
    const wrapper = mount(PaddingHierarchyPanel, { props: { targets: [target], read: store.readPadding, set: store.setPadding, reset: store.resetPadding } })
    expect(wrapper.findAll('[data-padding-context="forms.input-global"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-padding-context="forms.input-section"]')).toHaveLength(1)
    expect(wrapper.findAll('[data-padding-context="forms.input-component"]')).toHaveLength(1)
    await wrapper.find('[data-padding-context="forms.input-section"] input[aria-label="forms.input · Section · forms linked padding"]').setValue('10')
    await wrapper.find('[data-padding-context="forms.input-section"] button[aria-label="forms.input · Section · forms apply linked padding"]').trigger('click')
    expect(store.theme.padding).toContainEqual(expect.objectContaining({ scope: 'section', sectionId: 'forms' }))
  })

  it('uses unique linked input IDs for every target context', () => {
    const wrapper = mount(PaddingEdgeEditor, { props: { linked: true, contextKey: 'forms-input-section', contextLabel: 'Section · forms', edges: { top: '1px', right: '1px', bottom: '1px', left: '1px' } } })
    expect(wrapper.get('label').attributes('for')).toBe('padding-forms-input-section-linked')
    expect(wrapper.get('input').attributes('id')).toBe('padding-forms-input-section-linked')
  })

  it('reads variant and state rows with their full canonical request identity', async () => {
    const store = useThemeStore()
    const target = { id: 'buttons.default', sectionId: 'buttons', targetKind: 'leaf' as const, status: 'supported' as const, units: ['px'], variants: ['primary'], states: ['disabled'] }
    const wrapper = mount(PaddingHierarchyPanel, { props: { targets: [target], read: store.readPadding, set: store.setPadding, reset: store.resetPadding } })
    const variant = wrapper.find('[data-padding-context="buttons.default-variant-primary"]')
    await variant.get('input[aria-label="buttons.default · Variant · primary linked padding"]').setValue('9')
    await variant.get('button[aria-label="buttons.default · Variant · primary apply linked padding"]').trigger('click')
    expect(store.theme.padding).toContainEqual(expect.objectContaining({ scope: 'variant', variantId: 'primary' }))
    expect(variant.get('button[aria-label*="Variant"]')).toBeTruthy()
  })
})
