import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'

import { usePreviewTheme } from '@/composables/use-preview-theme'
import { useThemeStore } from '@/stores/theme'

describe('preview theme state effects', () => {
  it('posts foundation, icon, branding, and raw override changes from canonical Pinia state', async () => {
    const postMessage = vi.fn()
    const iframeElement = document.createElement('iframe')
    Object.defineProperty(iframeElement, 'contentWindow', {
      configurable: true,
      value: { postMessage },
    })
    const iframe = ref<HTMLIFrameElement | undefined>(iframeElement)
    let themeStore: ReturnType<typeof useThemeStore> | undefined
    let effects: ReturnType<typeof usePreviewTheme> | undefined
    const wrapper = mount(
      {
        setup() {
          themeStore = useThemeStore()
          effects = usePreviewTheme({
            theme: themeStore,
            activeMode: ref('light'),
            previewUrl: '/demo/admin',
            iframe,
          })
          return {}
        },
        template: '<div />',
      },
      { global: { plugins: [createPinia()] } },
    )
    postMessage.mockClear()

    themeStore?.setFoundation('density', 'compact')
    await nextTick()
    expect(postMessage.mock.lastCall?.[0].theme.foundations.density).toBe('compact')

    themeStore?.setIconPack('solid')
    await nextTick()
    expect(postMessage.mock.lastCall?.[0].theme.icons.pack).toBe('solid')

    themeStore?.setBrandingSetting('appName', 'Acme')
    await nextTick()
    expect(postMessage.mock.lastCall?.[0].theme.branding.appName).toBe('Acme')
    expect(effects?.iframeSrc.value).toContain('ftb_branding=')

    themeStore?.setRawOverride('.fi-btn', 'color', '#0f766e')
    await nextTick()
    expect(postMessage.mock.lastCall?.[0].theme.rawOverrides).toEqual([
      { selector: '.fi-btn', properties: { color: '#0f766e' } },
    ])

    wrapper.unmount()
  })
})
