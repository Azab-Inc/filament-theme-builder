import { computed, onMounted, onUnmounted, ref } from 'vue'
import { guidelineVariants, isGuidelineVariant, type GuidelineVariant } from '@/models/guidelines-prototype.model'

export function useGuidelinesPrototype() {
  const params = new URLSearchParams(location.search)
  const requested = params.get('variant')
  const variant = ref<GuidelineVariant>(isGuidelineVariant(requested) ? requested : 'actions')
  const update = () => {
    const next = new URLSearchParams(location.search).get('variant')
    if (isGuidelineVariant(next)) variant.value = next
  }
  const index = computed(() => guidelineVariants.indexOf(variant.value))
  const navigate = (delta: number) => {
    const next = guidelineVariants[(index.value + delta + guidelineVariants.length) % guidelineVariants.length]!
    const url = new URL(location.href); url.searchParams.set('guidelines-prototype', '1'); url.searchParams.set('variant', next)
    history.pushState({}, '', url); update()
  }
  onMounted(() => addEventListener('popstate', update)); onUnmounted(() => removeEventListener('popstate', update))
  return { variant, navigate }
}
