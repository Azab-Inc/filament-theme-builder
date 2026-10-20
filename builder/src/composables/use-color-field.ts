import { shallowRef, watch, type Ref } from 'vue'
import type { ColorFieldProfile } from '@/utils/color-field-validation'

export function useColorField(value: Ref<string>, profile: Ref<ColorFieldProfile>, contextKey: Ref<string>, resetKey: Ref<string | number | undefined>) {
  const draft = shallowRef(value.value)
  const open = shallowRef(false)
  watch([contextKey, profile, resetKey], () => { draft.value = value.value; open.value = false })
  return { draft, open }
}
