import { describe, expect, it, vi } from 'vitest'
import { computed, nextTick, ref, watch } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import { usePreviewTheme } from '@/composables/use-preview-theme'
import { useInspector } from '@/composables/use-inspector'
import { useThemeStore } from '@/stores/theme'
import { createThemeRegistry } from '@/registry/theme-registry'
import type { EditorSection } from '@/models/editor.model'

describe('preview effect composables', () => {
  it('synchronizes the canonical Pinia theme and reloads runtime branding without replacing the iframe element', async () => {
    const postMessage = vi.fn()
    const iframe = ref<HTMLIFrameElement>()
    const activeMode = ref<'light' | 'dark'>('light')
    let handlePreviewLoad: () => void = () => undefined
    const wrapper = mount(
      {
        setup() {
          const theme = useThemeStore()
          const effects = usePreviewTheme({
            theme,
            activeMode,
            previewUrl: '/demo/admin',
            iframe,
          })
          handlePreviewLoad = effects.onPreviewLoad
          watch(
            () => effects.iframeSrc.value,
            () => undefined,
          )
          return effects
        },
        template: '<div />',
      },
      { global: { plugins: [createPinia()] } },
    )

    const element = document.createElement('iframe')
    Object.defineProperty(element, 'contentWindow', { configurable: true, value: { postMessage } })
    iframe.value = element
    await nextTick()
    handlePreviewLoad()

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ftb:theme:update', schemaVersion: 1 }),
      expect.any(String),
    )
    const initialSrc = wrapper.vm.iframeSrc
    expect(wrapper.vm.iframeSrc).toBe(initialSrc)

    wrapper.unmount()
  })

  it('cleans Inspector message listeners per mount and preserves validated selection state', async () => {
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const iframe = ref<HTMLIFrameElement>()
    const selectedEditorSection = ref<EditorSection>('foundations')
    const rawSelector = ref('')
    const rawSelectorError = ref<string | undefined>()
    const rawSelectorProposal = computed(() => ({ selector: '.fi-btn', quality: 'exact' as const }))
    const wrapper = mount({
      setup() {
        const inspector = useInspector({
          iframe,
          previewUrl: '/demo/admin',
          inspectorRegistry: createThemeRegistry(),
          selectedEditorSection,
          rawSelector,
          rawSelectorError,
          rawSelectorProposal,
        })
        return inspector
      },
      template: '<div />',
    })

    const listener = addListener.mock.calls.find(([type]) => type === 'message')?.[1]
    expect(listener).toBeDefined()
    wrapper.unmount()
    expect(removeListener).toHaveBeenCalledWith('message', listener)

    addListener.mockRestore()
    removeListener.mockRestore()
  })

})
