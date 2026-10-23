import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import PaddingEdgeEditor from '@/components/PaddingEdgeEditor.vue'
import PaddingHierarchyPanel from '@/components/PaddingHierarchyPanel.vue'
import { useThemeStore } from '@/stores/theme'

describe('padding editor UI', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('shows mixed linked edges without changing them when linking', async () => {
    const wrapper = mount(PaddingEdgeEditor, { props: { linked: false, edges: { top: '6px', right: '12px', bottom: '6px', left: '12px' } } })
    await wrapper.get('button[aria-label="Link all edges"]').trigger('click')
    expect(wrapper.emitted('set')).toBeUndefined()
    expect(wrapper.text()).toContain('Mixed')
  })

  it('emits one atomic linked mutation and preserves separate editing', async () => {
    const wrapper = mount(PaddingEdgeEditor, { props: { linked: true, edges: { top: '6px', right: '12px', bottom: '6px', left: '12px' } } })
    await wrapper.get('input[aria-label="Linked padding"]').setValue('8px')
    await wrapper.get('button[aria-label="Apply linked padding"]').trigger('click')
    expect(wrapper.emitted('set')?.[0]).toEqual([{ top: '8px', right: '8px', bottom: '8px', left: '8px' }])
  })

  it('renders registry rows and delegates mutations to the store', async () => {
    const store = useThemeStore()
    const wrapper = mount(PaddingHierarchyPanel, { props: { targets: [{ id: 'forms.input', sectionId: 'forms', targetKind: 'leaf', status: 'supported', units: ['px'], variants: [], states: [] }], read: store.readPadding, set: store.setPadding, reset: store.resetPadding } })
    expect(wrapper.text()).toContain('forms.input')
    await wrapper.get('button[aria-label="Reset forms.input padding"]').trigger('click')
    expect(store.theme.padding).toEqual([])
  })
})
