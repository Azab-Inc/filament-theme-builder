import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { driver, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { OnboardingTourOptions } from '@/models/onboarding-tour-options.model'
import { ONBOARDING_TOUR_STEPS } from '@/tour/onboarding-tour-manifest'
import { readOnboardingTourCompletion, writeOnboardingTourCompletion } from '@/utils/onboarding-tour-storage'

export function useOnboardingTour({ ready }: OnboardingTourOptions) {
  const active = ref(false)
  let instance: Driver | null = null
  let opener: HTMLElement | undefined
  let autoStarted = false

  function availableSteps() {
    return ONBOARDING_TOUR_STEPS.filter((step) => {
      const element = document.querySelector(step.selector)
      if (!(element instanceof HTMLElement) || element.hidden) return false
      let ancestor: HTMLElement | null = element
      while (ancestor) {
        const style = window.getComputedStyle(ancestor)
        if (ancestor.hidden || style.display === 'none' || style.visibility === 'hidden') return false
        ancestor = ancestor.parentElement
      }
      return true
    })
  }

  function finish(): void {
    writeOnboardingTourCompletion()
    close()
  }

  function close(): void {
    if (!instance) return
    const current = instance
    instance = null
    active.value = false
    current.destroy()
    nextTick(() => opener?.focus())
  }

  function start(replay = false, source?: HTMLElement): void {
    if (active.value || (!replay && readOnboardingTourCompletion())) return
    const steps = availableSteps()
    if (!steps.length) return
    opener = source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined)
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    instance = driver({
      steps: steps.map(({ selector, title, description }) => ({ element: selector, popover: { title, description, showButtons: ['previous', 'next', 'close'], nextBtnText: 'Next', prevBtnText: 'Back' } })),
      showProgress: true,
      progressText: 'Step {{current}} of {{total}}',
      doneBtnText: 'Done',
      animate: !reducedMotion,
      allowClose: true,
      onPopoverRender: (popover, options) => {
        popover.closeButton.textContent = 'Skip tour'
        popover.closeButton.setAttribute('aria-label', 'Skip tour')
        popover.nextButton.textContent = options.state.activeIndex === steps.length - 1 ? 'Done' : 'Next'
        popover.wrapper.setAttribute('aria-live', 'polite')
        popover.wrapper.setAttribute('tabindex', '-1')
        popover.wrapper.focus()
      },
      onHighlighted: () => { instance?.getState().popover?.wrapper.focus() },
      onCloseClick: finish,
      onDestroyStarted: () => finish(),
      onNextClick: () => instance?.hasNextStep() ? instance.moveNext() : finish(),
      onPrevClick: () => instance?.movePrevious(),
    })
    active.value = true
    instance.drive()
  }

  function replay(source?: HTMLElement): void { start(true, source ?? (document.activeElement instanceof HTMLElement ? document.activeElement : undefined)) }

  const attempt = (): void => { if (ready()) start() }
  onMounted(() => {
    if (autoStarted) return
    autoStarted = true
    nextTick(attempt)
    window.addEventListener('ftb:preview-ready', attempt)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('ftb:preview-ready', attempt)
    close()
  })

  return { active, start, replay, next: () => instance?.moveNext(), previous: () => instance?.movePrevious(), skip: finish, close }
}
