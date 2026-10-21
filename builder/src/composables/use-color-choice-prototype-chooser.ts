import type { Ref } from 'vue'
import type { ColorChoicePrototypeTarget } from '@/models/color-choice-prototype.model'

export function useColorChoicePrototypeChooser(
  activePath: Ref<string | null>,
  draft: Ref<string>,
  tab: Ref<'Custom' | 'Tailwind'>,
  anchor: Ref<{ left: number; top: number }>,
  getValue: (target: ColorChoicePrototypeTarget) => string,
) {
  function open(target: ColorChoicePrototypeTarget, point?: { left: number; top: number }) {
    activePath.value = target.path
    draft.value = getValue(target)
    tab.value = draft.value.startsWith('var(') ? 'Custom' : 'Tailwind'
    if (point)
      anchor.value = {
        left: Math.max(8, Math.min(point.left, innerWidth - 390)),
      top: Math.max(72, Math.min(point.top, innerHeight - 568)),
      }
  }
  function close() {
    const path = activePath.value
    activePath.value = null
    if (path) requestAnimationFrame(() => document.getElementById(`field-${path}`)?.focus())
  }
  return { open, close }
}
