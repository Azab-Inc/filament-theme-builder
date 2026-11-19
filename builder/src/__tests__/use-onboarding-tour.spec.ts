import { defineComponent, nextTick, ref } from 'vue'
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { driver } from 'driver.js'
import { useOnboardingTour } from '@/composables/use-onboarding-tour'
import { ONBOARDING_TOUR_STORAGE_KEY } from '@/utils/onboarding-tour-storage'
vi.mock('driver.js', () => ({ driver: vi.fn() }))
type FakeDriver = { drive: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn>; moveNext: ReturnType<typeof vi.fn>; movePrevious: ReturnType<typeof vi.fn>; hasNextStep: ReturnType<typeof vi.fn> }
function createHarness() {
  const ready = ref(false)
  let api: ReturnType<typeof useOnboardingTour>
  const component = defineComponent({
    setup() { api = useOnboardingTour({ ready: () => ready.value }); return { ready, tour: api! } },
    template: '<div><button data-tour="welcome">Welcome</button><button data-tour="editor-navigation">Editor</button><div data-tour-foundations-wrapper><button data-tour="foundations">Foundations</button></div><button data-tour="live-preview">Preview</button><button data-tour="inspector">Inspector</button><button data-tour="tools">Tools</button><button data-tour="finish">Finish</button></div>',
  })
  return { component, ready, getApi: () => api }
}
function setupDriver(): { fake: FakeDriver; config: Record<string, unknown> } {
  const fake: FakeDriver = { drive: vi.fn(), destroy: vi.fn(), moveNext: vi.fn(), movePrevious: vi.fn(), hasNextStep: vi.fn(() => true) }
  const config = {} as Record<string, unknown>
  vi.mocked(driver).mockImplementation((value) => { Object.assign(config, value); return fake as never })
  return { fake, config }
}
describe('useOnboardingTour lifecycle', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(driver).mockReset()
    vi.stubGlobal('matchMedia', () => ({ matches: false, media: '', onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false }))
  })
  afterEach(() => { document.body.innerHTML = '' })

  it('waits for a successful preview-ready signal and ignores repeated starts', async () => {
    const { component, ready, getApi } = createHarness()
    const { fake } = setupDriver()
    const wrapper = mount(component, { attachTo: document.body })
    window.dispatchEvent(new Event('ftb:preview-ready'))
    expect(fake.drive).not.toHaveBeenCalled()
    ready.value = true
    window.dispatchEvent(new Event('ftb:preview-ready'))
    await nextTick()
    getApi().start()
    expect(fake.drive).toHaveBeenCalledOnce()
    expect(vi.mocked(driver)).toHaveBeenCalledOnce()
    wrapper.unmount()
  })

  it('records Escape/close completion and keeps an interrupted tour resumable', async () => {
    const { component, ready, getApi } = createHarness()
    const { fake, config } = setupDriver()
    const wrapper = mount(component, { attachTo: document.body })
    ready.value = true
    getApi().start()
    await nextTick()
    const onDestroyStarted = config.onDestroyStarted as (element: undefined, step: undefined, options: { reason: string }) => void
    onDestroyStarted(undefined, undefined, { reason: 'escape' })
    expect(fake.destroy).toHaveBeenCalledOnce()
    expect(localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toContain('schemaVersion')
    wrapper.unmount()

    localStorage.clear()
    const second = createHarness()
    const secondSetup = setupDriver()
    const secondWrapper = mount(second.component, { attachTo: document.body })
    second.ready.value = true
    window.dispatchEvent(new Event('ftb:preview-ready'))
    await nextTick()
    expect(secondSetup.fake.drive).toHaveBeenCalledOnce()
    secondWrapper.unmount()
    expect(secondSetup.fake.destroy).toHaveBeenCalledOnce()
    expect(localStorage.getItem(ONBOARDING_TOUR_STORAGE_KEY)).toBeNull()
  })

  it('configures reduced motion and skips hidden anchors while retaining order', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, media: '', onchange: null, addListener: () => undefined, removeListener: () => undefined, addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false }))
    const { component, ready, getApi } = createHarness()
    const { config } = setupDriver()
    const wrapper = mount(component, { attachTo: document.body })
    wrapper.get('[data-tour-foundations-wrapper]').element.setAttribute('hidden', '')
    ready.value = true
    getApi().start()
    expect(config.animate).toBe(false)
    expect((config.steps as Array<{ element: string }>).some(({ element }) => element === '[data-tour="foundations"]')).toBe(false)
    wrapper.unmount()
  })

  it('supports replay navigation and cleans its preview listener on unmount', () => {
    const { component, getApi } = createHarness()
    const { fake } = setupDriver()
    const wrapper = mount(component, { attachTo: document.body })
    getApi().replay()
    expect(fake.drive).toHaveBeenCalledOnce()
    getApi().next()
    getApi().previous()
    expect(fake.moveNext).toHaveBeenCalledOnce()
    expect(fake.movePrevious).toHaveBeenCalledOnce()
    wrapper.unmount()
    window.dispatchEvent(new Event('ftb:preview-ready'))
    expect(vi.mocked(driver)).toHaveBeenCalledOnce()
  })
})
