import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import PreviewFrame from '@/components/PreviewFrame.vue'

describe('PreviewFrame', () => {
  it('preserves the editor-before-preview DOM structure and iframe contract', async () => {
    const setIframe = vi.fn()
    const onPreviewLoad = vi.fn()
    const onPreviewError = vi.fn()
    const wrapper = mount(PreviewFrame, {
      props: {
        iframeSrc: '/demo/admin?theme=preview',
        setIframe,
        onPreviewLoad,
        onPreviewError,
      },
      slots: {
        default: '<section data-editor-panel aria-label="Editor panel">Editor controls</section>',
      },
    })

    const workspace = wrapper.get('[data-editor-workspace]')
    const iframe = wrapper.get('iframe')
    expect(Array.from(workspace.element.children).map((element) => element.tagName)).toEqual(['SECTION', 'BUTTON', 'IFRAME'])
    expect(wrapper.get('[role="separator"]').attributes()).toMatchObject({
      'aria-label': 'Resize editor and preview',
      'aria-orientation': 'vertical',
    })
    expect(workspace.element.firstElementChild).toBe(wrapper.get('[data-editor-panel]').element)
    expect(iframe.attributes()).toMatchObject({
      src: '/demo/admin?theme=preview',
      title: 'Filament preview',
      class: 'preview-shell__frame',
    })
    expect(iframe.attributes('data-editor-iframe')).toBeDefined()
    expect(setIframe.mock.calls[0]?.[0]).toBe(iframe.element)

    await iframe.trigger('load')
    expect(onPreviewLoad).toHaveBeenCalledOnce()
    await iframe.trigger('error')
    expect(onPreviewError).toHaveBeenCalledOnce()
    wrapper.unmount()
    expect(setIframe).toHaveBeenLastCalledWith(null)
  })
})
