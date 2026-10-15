import { describe, it, expect, vi } from 'vitest'

import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import App from '../App.vue'
import ThrowawayThemePrototype from '../components/ThrowawayThemePrototype.vue'
import HoverInspectPrototype from '../components/HoverInspectPrototype.vue'
import EditorToolbar from '../components/EditorToolbar.vue'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'
import * as vanillaCssExport from '@/utils/vanilla-css-export'

describe('App', () => {
  it('keeps the editor toolbar public hooks and forwards export and recovery actions', async () => {
    const wrapper = mount(EditorToolbar, {
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
      },
    })

    for (const name of [
      'Export theme JSON', 'Copy vanilla CSS', 'Download vanilla CSS',
      'Export PanelProvider icon config', 'Export panel branding JSON',
      'Export PanelProvider branding config', 'Undo', 'Redo', 'Inspector',
      'Restore legacy customization', 'Download archived legacy JSON',
    ]) {
      expect(wrapper.get(`[aria-label="${name}"]`)).toBeTruthy()
    }
    expect(wrapper.get('[data-editor-header-controls]')).toBeTruthy()
    expect(wrapper.get('[data-export-status]').text()).toBe('Vanilla CSS copied to clipboard.')
    expect(wrapper.get('[data-inspector-status]').text()).toBe('Product name input')
    expect(wrapper.get('[data-preview-loading]').text()).toBe('Refreshing runtime preview…')
    expect(wrapper.get('[role="alert"].legacy-recovery').text()).toContain('Archive needs review')
    expect((wrapper.get('[aria-label="Undo"]').element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.get('[aria-label="Inspector"]').attributes('aria-pressed')).toBe('true')

    const actionButtons = {
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

  it('keeps the builder DOM hooks used by accessibility, automation, and preview tools', () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('iframe[title="Filament preview"]')).toBeTruthy()
    expect(wrapper.get('[data-editor-workspace] [data-editor-panel][aria-label="Editor panel"]')).toBeTruthy()
    expect(wrapper.get('[data-editor-navigation]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="foundations"]#editor-panel-foundations[role="tabpanel"][aria-labelledby="editor-tab-foundations"]')).toBeTruthy()
    expect(wrapper.get('[role="status"][aria-label="Inspector status"][data-inspector-status]')).toBeTruthy()
    expect(wrapper.get('#density')).toBeTruthy()
    expect(wrapper.get('#body-font-name')).toBeTruthy()
    expect(wrapper.get('#spacing-1-5')).toBeTruthy()
    expect(wrapper.get('[aria-label="Upload light logo"]')).toBeTruthy()
    expect(wrapper.get('[data-editor-target="form.product-name"]')).toBeTruthy()

    wrapper.unmount()
  })

  it('renders typography and layout foundations through the extracted editor control boundary', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const controls = wrapper.findComponent({ name: 'FoundationsTypographyLayoutControls' })

    expect(controls.exists()).toBe(true)
    expect(controls.findAll('fieldset legend').map((legend) => legend.text())).toEqual([
      'Typography',
      'Layout foundations',
    ])
    expect(controls.findAll('input, select').map((control) => control.attributes('id'))).toEqual([
      'body-font-kind', 'body-font-name',
      'heading-font-kind', 'heading-font-name',
      'mono-font-kind', 'mono-font-name',
      'density',
      'spacing-0', 'spacing-1', 'spacing-2', 'spacing-3', 'spacing-4',
      'spacing-6', 'spacing-8', 'spacing-px', 'spacing-0-5', 'spacing-1-5',
      'radius', 'border-width', 'shadow',
    ])
    expect(wrapper.get('#body-font-kind').attributes('aria-label')).toBe('body font type')
    expect(wrapper.get('#body-font-name').attributes('aria-label')).toBe('body font name')
    expect(wrapper.get('#spacing-0-5').attributes('type')).toBe('number')
    expect((wrapper.get('#spacing-0-5').element as HTMLInputElement).value).toBe('2')
    expect(wrapper.get('#density').attributes('aria-label')).toBeUndefined()
    expect(wrapper.get('[role="group"][aria-label="Density presets"]')).toBeTruthy()
    expect(wrapper.get('#radius').element).toHaveProperty('value', 'md')
    expect(wrapper.get('#border-width').attributes('min')).toBe('0')
    expect(wrapper.get('#shadow').element).toHaveProperty('value', 'sm')
    expect(wrapper.get('[aria-label="Reset spacing 0.5"]').text()).toBe('Reset')
    wrapper.unmount()
  })

  it('keeps layout foundation input timing and undo/reset callbacks unchanged', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const spacing = wrapper.get('#spacing-1-5')

    await spacing.setValue('7.25')

    expect((spacing.element as HTMLInputElement).value).toBe('7.25')
    expect(wrapper.get('button[aria-label="Undo"]').attributes('disabled')).toBeUndefined()
    expect(spacing.element.nextElementSibling?.textContent).toBe('live-emulation')

    await wrapper.get('button[aria-label="Undo"]').trigger('click')
    expect(wrapper.get('#spacing-1-5').element).toHaveProperty('value', '6')
    await wrapper.get('button[aria-label="Redo"]').trigger('click')
    expect(wrapper.get('#spacing-1-5').element).toHaveProperty('value', '7.25')

    await wrapper.get('[aria-label="Reset spacing 1.5"]').trigger('click')
    expect(wrapper.get('#spacing-1-5').element).toHaveProperty('value', '6')
    await wrapper.get('[aria-label="Compact density"]').trigger('click')
    expect(wrapper.get('#density').element).toHaveProperty('value', 'compact')

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('removes the window listeners it owns when the builder unmounts', () => {
    window.history.replaceState({}, '', '/')
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const ownedListeners = addListener.mock.calls.filter(([type]) => type === 'keydown' || type === 'message')

    wrapper.unmount()

    for (const [type, listener] of ownedListeners) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }
    expect(ownedListeners.map(([type]) => type)).toEqual(expect.arrayContaining(['keydown', 'message']))

    addListener.mockRestore()
    removeListener.mockRestore()
  })

  it('keeps listeners mount-local when multiple builders are mounted and disposed independently', () => {
    window.history.replaceState({}, '', '/')
    const addListener = vi.spyOn(window, 'addEventListener')
    const removeListener = vi.spyOn(window, 'removeEventListener')
    const first = mount(App, { global: { plugins: [createPinia()] } })
    const second = mount(App, { global: { plugins: [createPinia()] } })
    const firstListeners = addListener.mock.calls.filter(([type]) => type === 'keydown' || type === 'message')
    const secondListeners = firstListeners.slice(2)

    first.unmount()

    for (const [type, listener] of firstListeners.slice(0, 2)) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }
    for (const [type, listener] of secondListeners) {
      expect(removeListener).not.toHaveBeenCalledWith(type, listener)
    }

    second.unmount()

    for (const [type, listener] of secondListeners) {
      expect(removeListener).toHaveBeenCalledWith(type, listener)
    }

    addListener.mockRestore()
    removeListener.mockRestore()
  })

  it('mounts the hover inspector only behind the inspect query gate', () => {
    window.history.replaceState({}, '', '/?inspect=1&variant=B')
    const inspected = mount(App, { global: { plugins: [createPinia()] } })

    expect(inspected.find('[data-hover-inspect-prototype="B"]').exists()).toBe(true)
    expect(inspected.find('[data-prototype]').exists()).toBe(false)
    inspected.unmount()

    window.history.replaceState({}, '', '/?variant=B')
    const normal = mount(App, { global: { plugins: [createPinia()] } })
    expect(normal.find('[data-hover-inspect-prototype]').exists()).toBe(false)
    expect(normal.get('section.foundations')).toBeTruthy()
    normal.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('models mapped, unmapped, pinned, and keyboard inspection in the prototype', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'A' } })
    const widget = wrapper.get('[data-inspect-target="widget"]')

    await widget.trigger('mouseenter')
    await new Promise((resolve) => setTimeout(resolve, 220))
    expect(wrapper.get('[data-inspector-details]').text()).toContain('Dashboard stats widget')
    expect(wrapper.get('[data-editor-highlight]').attributes('data-editor-highlight')).toBe('widgets.stats')

    await widget.trigger('click')
    await widget.trigger('mouseleave')
    expect(wrapper.get('[data-inspector-details]').text()).toContain('PINNED INSPECTION')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    await wrapper.get('[data-inspect-target="unmapped"]').trigger('mouseenter')
    await new Promise((resolve) => setTimeout(resolve, 220))
    expect(wrapper.get('[data-inspector-details]').text()).toContain('Detected, but not mapped')
    expect(wrapper.get('[data-inspector-details]').text()).toContain('No editor section is linked')

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-inspector-details]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('switches navigation orientation inside the editor without changing the demo pane', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'A' } })
    const demo = wrapper.get('.inspect__demo')
    const demoMarkup = demo.element.innerHTML
    const navigation = wrapper.get('.inspect__editor-nav')

    expect(navigation.classes()).toContain('inspect__editor-nav--vertical')
    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('Sidebar')
    expect(wrapper.get('.inspect__workspace').element.children).toHaveLength(2)

    await wrapper.get('button[aria-pressed="false"]').trigger('click')

    expect(wrapper.get('button[aria-pressed="true"]').text()).toBe('Top navigation')
    expect(wrapper.get('.inspect__editor-nav').classes()).toContain('inspect__editor-nav--horizontal')
    expect(wrapper.get('.inspect__demo').classes()).toEqual(['inspect__demo'])
    expect(wrapper.get('.inspect__demo').element.innerHTML).toBe(demoMarkup)
    expect(wrapper.get('.inspect__workspace').element.children).toHaveLength(2)
    expect(wrapper.get('.inspect__editor').element.nextElementSibling).toBe(wrapper.get('.inspect__demo-wrap').element)
    wrapper.unmount()
  })

  it('delays hover inspection with auto-scroll off and keeps variants shareable', async () => {
    const wrapper = mount(HoverInspectPrototype, { props: { initialVariant: 'B' } })
    await wrapper.get('label.inspect__auto-scroll input').setValue(false)
    await wrapper.get('[data-inspect-target="card"]').trigger('mouseenter')
    expect(wrapper.find('[data-inspector-details]').exists()).toBe(false)
    await new Promise((resolve) => setTimeout(resolve, 220))
    expect(wrapper.get('[data-inspector-details]').text()).toContain('Recent orders card')

    await wrapper.get('button[aria-label="Variant C"]').trigger('click')
    expect(wrapper.attributes('data-hover-inspect-prototype')).toBe('C')
    expect(window.location.search).toContain('inspect=1')
    expect(window.location.search).toContain('variant=C')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    await wrapper.vm.$nextTick()
    expect(wrapper.attributes('data-hover-inspect-prototype')).toBe('B')
    expect(window.location.search).toContain('variant=B')
    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('passes the supplied demo URL to the prototype iframe and gives it explicit height', () => {
    const previewUrl = 'http://127.0.0.1:4174/demo/admin'
    const wrapper = mount(ThrowawayThemePrototype, {
      props: { initialVariant: 'C', previewUrl },
    })
    const iframe = wrapper.get('iframe')

    expect(iframe.attributes('src')).toBe(previewUrl)
    expect(iframe.attributes('style')).toContain('height: 100%')

    wrapper.unmount()
  })

  it('embeds the public Filament preview and reserves a subtle notice area', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
    expect(wrapper.find('[data-demo-notice]').exists()).toBe(true)
    expect(wrapper.get('input[type="color"]').attributes('aria-label')).toBe('Primary color')
    expect(wrapper.find('button[aria-label="Undo"]').exists()).toBe(true)
    expect(wrapper.find('button[aria-label="Redo"]').exists()).toBe(true)
  })

  it('copies the exact generated CSS content to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Copy vanilla CSS"]').trigger('click')

    expect(writeText).toHaveBeenCalledOnce()
    expect(writeText.mock.calls[0]?.[0]).toContain('/* Generated with Filament Theme Builder */')
    expect(wrapper.get('[data-export-status]').text()).toContain('copied to clipboard')
    wrapper.unmount()
  })

  it('downloads CSS as a Blob containing raw rules', async () => {
    const state = createDefaultThemeState()
    state.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#0f766e' } }]
    localStorage.setItem('ftb-theme', JSON.stringify(state))
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:theme-css')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Download vanilla CSS"]').trigger('click')

    const blob = createObjectURL.mock.calls[0]?.[0]
    expect(blob).toBeInstanceOf(Blob)
    expect(await (blob as Blob).text()).toContain('.fi-btn {')
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:theme-css')
    wrapper.unmount()
  })

  it('shows raw export errors while retaining and copying valid CSS output', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const exportSpy = vi.spyOn(vanillaCssExport, 'exportVanillaCss').mockReturnValue({
      css: '/* Foundations */\n.fi-btn { color: #ffffff; }',
      errors: ['Selector must contain only safe .fi-* class selectors and limited pseudo-classes'],
    })

    await wrapper.get('button[aria-label="Copy vanilla CSS"]').trigger('click')

    expect(wrapper.get('[data-export-status]').text()).toMatch(/safe \.fi-\* class selectors/i)
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('/* Foundations */'))
    exportSpy.mockRestore()
    wrapper.unmount()
  })

  it('exports canonical JSON with rawOverrides', async () => {
    const state = createDefaultThemeState()
    state.rawOverrides = [{ selector: '.fi-input', properties: { 'border-radius': '0.75rem' } }]
    localStorage.setItem('ftb-theme', JSON.stringify(state))
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:theme-json')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    createObjectURL.mockClear()
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Export theme JSON"]').trigger('click')

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob
    expect(JSON.parse(await blob.text()).rawOverrides).toEqual(state.rawOverrides)
    wrapper.unmount()
  })

  it('preserves the public export filenames and JSON export bytes', async () => {
    localStorage.clear()
    const downloads: string[] = []
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:builder-export')
    createObjectURL.mockClear()
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      downloads.push(this.download)
    })
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('button[aria-label="Export theme JSON"]').trigger('click')
    const jsonBlob = createObjectURL.mock.calls[0]?.[0]
    expect(jsonBlob).toBeInstanceOf(Blob)
    expect(await (jsonBlob as Blob).text()).toBe(
      JSON.stringify(serializeCanonicalTheme(createDefaultThemeState()), null, 2),
    )

    await wrapper.get('button[aria-label="Download vanilla CSS"]').trigger('click')
    await wrapper.get('button[aria-label="Export PanelProvider icon config"]').trigger('click')
    await wrapper.get('button[aria-label="Export panel branding JSON"]').trigger('click')
    await wrapper.get('button[aria-label="Export PanelProvider branding config"]').trigger('click')

    expect(downloads).toEqual([
      'filament-theme.json',
      'theme.css',
      'filament-panel-icon-config.php',
      'filament-panel-branding.json',
      'filament-panel-branding.php',
    ])
    wrapper.unmount()
  })

  it('exposes an accessible Inspector toggle and breadcrumb status without changing the iframe URL', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe')
    const src = iframe.attributes('src')

    expect(wrapper.get('button[aria-label="Inspector"]').attributes('aria-pressed')).toBe('false')
    await wrapper.get('button[aria-label="Inspector"]').trigger('click')
    expect(wrapper.get('button[aria-label="Inspector"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('iframe').attributes('src')).toBe(src)
    expect(wrapper.get('[role="status"][aria-label="Inspector status"]').text()).toContain('Inspector enabled')

    wrapper.unmount()
  })

  it('marks the existing Product name control as the only inspector editor target', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('[data-editor-section-button="components"]').trigger('click')

    expect(wrapper.findAll('[data-editor-target]').map((target) => target.attributes('data-editor-target')))
      .toEqual(['form.product-name'])
  })

  it('accepts Inspector events only from the current iframe and exact preview origin', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    const iframeWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: iframeWindow })
    const send = (origin: string, source: MessageEventSource | null) => {
      const event = new MessageEvent('message', {
        origin,
        source,
        data: {
          type: 'ftb:inspector:select',
          protocolVersion: 1,
          target: { candidateSelectors: ['.fi-fo-text-input .fi-input'], classNames: ['fi-input'] },
        },
      })
      window.dispatchEvent(event)
    }

    send('https://untrusted.invalid', iframeWindow)
    expect(wrapper.get('[data-inspector-status]').text()).toBe('Inspector disabled')
    send(window.location.origin, window)
    expect(wrapper.get('[data-inspector-status]').text()).toBe('Inspector disabled')

    await wrapper.get('button[aria-label="Inspector"]').trigger('click')
    send(window.location.origin, iframeWindow)
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-inspector-status]').text()).toContain('Product name input')

    wrapper.unmount()
  })

  it('shows Advanced Inspector controls with a stable raw selector and keeps semantic controls separate', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe').element as HTMLIFrameElement
    const iframeWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe, 'contentWindow', { configurable: true, value: iframeWindow })

    await wrapper.get('button[aria-label="Inspector"]').trigger('click')
    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: iframeWindow,
      data: {
        type: 'ftb:inspector:select',
        protocolVersion: 1,
        target: { candidateSelectors: ['.fi-btn.fi-primary', '.fi-btn'], classNames: ['fi-btn', 'fi-primary'] },
      },
    }))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[data-advanced-inspector]').exists()).toBe(true)
    expect((wrapper.get('#raw-selector').element as HTMLInputElement).value).toBe('.fi-btn')
    expect(wrapper.find('[data-selector-warning]').exists()).toBe(false)
    expect(wrapper.find('[data-editor-section-button="components"]').exists()).toBe(true)

    await wrapper.get('[aria-label="Raw color"]').setValue('#0f766e')
    expect(wrapper.get('[aria-label="Raw color"]').element).toBeTruthy()
    expect(wrapper.find('[data-export-status]').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clears the Inspector breadcrumb when the preview iframe navigates before re-enabling', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe')
    const iframeWindow = { postMessage: () => undefined } as unknown as Window
    Object.defineProperty(iframe.element, 'contentWindow', { configurable: true, value: iframeWindow })
    await wrapper.get('button[aria-label="Inspector"]').trigger('click')

    window.dispatchEvent(new MessageEvent('message', {
      origin: window.location.origin,
      source: iframeWindow,
      data: {
        type: 'ftb:inspector:select',
        protocolVersion: 1,
        target: { candidateSelectors: ['.fi-fo-text-input .fi-input'], classNames: ['fi-input'] },
      },
    }))
    await wrapper.vm.$nextTick()
    expect(wrapper.get('[data-inspector-status]').text()).toContain('Product name input')

    await iframe.trigger('load')
    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-inspector-status]').text()).toBe('Inspector enabled')
    wrapper.unmount()
  })

  it('keeps the normal editor layout when prototype mode is absent', () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.find('[data-prototype]').exists()).toBe(false)
    expect(wrapper.find('section.foundations').exists()).toBe(true)
  })

  it('promotes accessible Sidebar and Top navigation modes without forking editor state', async () => {
    window.history.replaceState({}, '', '/')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const iframe = wrapper.get('iframe').element
    const iframeSrc = wrapper.get('iframe').attributes('src')
    const primary = wrapper.get('input[type="color"]')

    expect(wrapper.get('[data-editor-navigation]')).toBeTruthy()
    expect(wrapper.get('[data-editor-navigation] [role="radio"][aria-checked="true"]').attributes('aria-label')).toBe('Sidebar')
    expect(wrapper.get('[data-editor-nav-rail]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="foundations"]')).toBeTruthy()

    await primary.setValue('#0f766e')
    await wrapper.get('input[value="top"]').setValue(true)
    await wrapper.get('[data-editor-section-tab="components"]').trigger('click')

    expect(wrapper.get('[data-editor-navigation] [role="radio"][aria-checked="true"]').attributes('aria-label')).toBe('Top navigation')
    expect(wrapper.get('[data-editor-tabs]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="components"]')).toBeTruthy()
    expect((primary.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('iframe').element).toBe(iframe)
    expect(wrapper.get('iframe').attributes('src')).toBe(iframeSrc)

    await wrapper.get('input[value="sidebar"]').setValue(true)

    expect(wrapper.get('[data-editor-nav-rail]')).toBeTruthy()
    expect(wrapper.get('[data-editor-section="components"]')).toBeTruthy()
    expect(wrapper.get('iframe').element).toBe(iframe)

    await wrapper.get('[data-editor-section-button="foundations"]').trigger('click')
    expect(wrapper.get('[data-editor-section="foundations"]')).toBeTruthy()
    expect((primary.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('iframe').element).toBe(iframe)

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('does not expose the production prototype query path', () => {
    window.history.replaceState({}, '', '/?prototype=1&variant=C')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.find('[data-prototype]').exists()).toBe(false)
    expect(wrapper.find('[data-editor-navigation]').exists()).toBe(true)

    wrapper.unmount()
    window.history.replaceState({}, '', '/')
  })

  it('enables undo and immediately updates the color editor after a color change', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const colorInput = wrapper.get('input[type="color"]')

    await colorInput.setValue('#0f766e')

    expect((colorInput.element as HTMLInputElement).value).toBe('#0f766e')
    expect(wrapper.get('button[aria-label="Undo"]').attributes('disabled')).toBeUndefined()
  })

  it('exposes accessible foundation sections without replacing the preview controls', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('section.foundations h2').text()).toBe('Foundations')
    expect(wrapper.get('input[aria-label="primary shade 500 override"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Light mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('select[aria-label="Density"], select#density')).toBeTruthy()
    expect(wrapper.get('#body-font-name')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Reset radius"]')).toBeTruthy()
    expect(wrapper.get('#spacing-1')).toBeTruthy()
    expect(wrapper.get('#border-default-light')).toBeTruthy()
    expect(wrapper.get('#border-strong-light')).toBeTruthy()
    expect(wrapper.get('#text-primary-light')).toBeTruthy()
    expect(wrapper.get('#text-muted-light')).toBeTruthy()
    expect(wrapper.get('#text-disabled-light')).toBeTruthy()
    expect(wrapper.get('#body-font-kind')).toBeTruthy()
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    expect(wrapper.find('label button').exists()).toBe(false)
    expect(wrapper.get('iframe').attributes('title')).toBe('Filament preview')
  })

  it('uses a responsive grid foundation layout contract', () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('section.foundations').classes()).toEqual(
      expect.arrayContaining(['grid', 'gap-4']),
    )
    expect(wrapper.get('section.foundations fieldset').classes()).toEqual(
      expect.arrayContaining(['grid', 'gap-4']),
    )
    expect(wrapper.get('section.foundations .foundation-row').classes()).toEqual(
      expect.arrayContaining([
        'grid',
        'grid-cols-1',
        'md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]',
      ]),
    )
  })

  it('reports explicit status when a user writes the current default value', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const input = wrapper.get('#primary-palette-base')

    await input.setValue('#6366f1')

    expect(input.element.nextElementSibling?.textContent).toBe('explicit')
  })

  it('shows a per-control error and does not persist an unsupported color reference', async () => {
    localStorage.clear()
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const input = wrapper.get('#sidebar-surface')

    await input.setValue('var(--not-a-tailwind-color)')

    expect(wrapper.get('[role="alert"][data-foundation-error="surfaces.sidebar.light"]').text()).toContain('Unsupported color reference')
    expect(localStorage.getItem('ftb-theme')).toBeNull()
  })

  it('clears only the matching validation error when that foundation is reset', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    const sidebar = wrapper.get('#sidebar-surface')
    const page = wrapper.get('#page-surface')

    await sidebar.setValue('var(--not-a-tailwind-color)')
    await page.setValue('var(--not-a-tailwind-color)')
    expect(sidebar.attributes('aria-invalid')).toBe('true')
    expect(page.attributes('aria-invalid')).toBe('true')

    await wrapper.get('button[aria-label="Reset sidebar surface"]').trigger('click')

    expect(wrapper.find('[data-foundation-error="surfaces.sidebar.light"]').exists()).toBe(false)
    expect(sidebar.attributes('aria-invalid')).toBeUndefined()
    expect(wrapper.find('[data-foundation-error="surfaces.page.light"]').exists()).toBe(true)
    expect(page.attributes('aria-invalid')).toBe('true')
  })

  it('exposes explicit recovery actions for an archived legacy theme', async () => {
    const legacy = createDefaultThemeState()
    delete (legacy.foundations as unknown as { explicitPaths?: string[] }).explicitPaths
    delete (legacy.foundations as unknown as { provenanceVersion?: number }).provenanceVersion
    localStorage.setItem('ftb-theme', JSON.stringify(legacy))
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('[role="alert"]').text()).toContain('legacy customization')
    expect(wrapper.get('button[aria-label="Restore legacy customization"]')).toBeTruthy()
    expect(wrapper.get('button[aria-label="Download archived legacy JSON"]')).toBeTruthy()
    await wrapper.get('button[aria-label="Restore legacy customization"]').trigger('click')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('offers raw download but disables restoration for malformed archived JSON', async () => {
    localStorage.setItem('ftb-theme', '{invalid')
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    expect(wrapper.get('[role="alert"]').text()).toContain('not valid JSON')
    expect((wrapper.get('button[aria-label="Restore legacy customization"]').element as HTMLButtonElement).disabled).toBe(true)
    expect(wrapper.get('button[aria-label="Download archived legacy JSON"]')).toBeTruthy()
  })

  it('keeps typography as names-only state and supports density and mode controls', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })

    await wrapper.get('#body-font-name').setValue('Editorial Sans')
    await wrapper.get('button[aria-label="Dark mode"]').trigger('click')
    await wrapper.get('button[aria-label="Compact density"]').trigger('click')

    expect(wrapper.get('#body-font-name').element).toHaveProperty('value', 'Editorial Sans')
    expect(wrapper.get('button[aria-label="Dark mode"]').attributes('aria-pressed')).toBe('true')
    expect(wrapper.get('#density').element).toHaveProperty('value', 'compact')
  })

  it('renders every exposed foundation control with an individual reset', async () => {
    const wrapper = mount(App, { global: { plugins: [createPinia()] } })
    await wrapper.get('button[aria-label="Light mode"]').trigger('click')

    for (const control of [
      'primary palette base',
      'success palette base',
      'warning palette base',
      'danger palette base',
      'info palette base',
      'gray palette base',
      'density',
      'spacing 1',
      'border default light',
      'border strong light',
      'text primary light',
      'text muted light',
      'text disabled light',
      'page surface',
      'body font',
      'radius',
      'border width',
      'shadow',
    ]) {
      expect(wrapper.find(`[aria-label="Reset ${control}"]`).exists(), control).toBe(true)
    }
  })
})
