import { computed, reactive, ref } from 'vue'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { PaletteName, ThemeMode } from '@/models/foundations.model'
import type {
  ColorChoicePrototypeMeta,
  ColorChoicePrototypeScope,
  ColorChoicePrototypeState,
  ColorChoicePrototypeTarget,
} from '@/models/color-choice-prototype.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { isColorChoicePrototypeDraft } from '@/utils/color-choice-prototype-colors'
import { useColorChoicePrototypeChooser } from '@/composables/use-color-choice-prototype-chooser'
import { useColorChoicePrototypeKeyboard } from '@/composables/use-color-choice-prototype-keyboard'
import {
  createColorChoiceTarget,
  readColorChoiceValue,
  resetColorChoiceValue,
  writeColorChoiceValue,
} from '@/utils/color-choice-prototype-state'

export function useColorChoicePrototype(): ColorChoicePrototypeState {
  const theme = reactive(createDefaultThemeState()),
    defaults = createDefaultThemeState()
  const mode = ref<ThemeMode>('dark'),
    section = ref<'Foundations' | 'Components'>('Foundations')
  const scope = ref<ColorChoicePrototypeScope>('global'),
    openPalette = ref<PaletteName | null>(null)
  const activePath = ref<string | null>(null),
    anchor = ref({ left: 24, top: 90 }),
    search = ref(''),
    tab = ref<'Custom' | 'Tailwind'>('Tailwind')
  const draft = ref(''),
    changed = ref(new Set<string>()),
    meta = reactive(new Map<string, ColorChoicePrototypeMeta>())
  const componentBackgrounds = reactive<Record<ColorChoicePrototypeScope, string>>({
    global: '#ffffff',
    component: '#ffffff',
    variant: '#ffffff',
    state: '#ffffff',
  })
  const changedCount = computed(() => changed.value.size)
  const target = createColorChoiceTarget
  const getValue = (item: ColorChoicePrototypeTarget) =>
    readColorChoiceValue(theme, componentBackgrounds, item)
  function getMeta(path: string): ColorChoicePrototypeMeta {
    return meta.get(path) ?? { token: null, source: 'Default' }
  }
  const { open, close } = useColorChoicePrototypeChooser(activePath, draft, tab, anchor, getValue)
  function apply(
    item: ColorChoicePrototypeTarget,
    value: string,
    token: string | null = null,
    originalValue?: string,
  ): boolean {
    if (!isColorChoicePrototypeDraft(value)) return false
    writeColorChoiceValue(theme, componentBackgrounds, item, value)
    meta.set(item.path, { token, source: token ? 'Tailwind' : 'Custom', originalValue })
    changed.value = new Set(changed.value).add(item.path)
    close()
    return true
  }
  function reset(item: ColorChoicePrototypeTarget) {
    resetColorChoiceValue(theme, componentBackgrounds, item)
    const next = new Set(changed.value)
    next.delete(item.path)
    changed.value = next
    meta.delete(item.path)
    if (activePath.value === item.path) close()
  }
  useColorChoicePrototypeKeyboard(() => activePath.value !== null, close)
  return {
    theme,
    defaults,
    mode,
    section,
    scope,
    openPalette,
    activePath,
    anchor,
    search,
    tab,
    draft,
    changed,
    componentBackgrounds,
    meta,
    changedCount,
    palettes: PALETTE_NAMES,
    shades: PALETTE_SHADES,
    target,
    getValue,
    getMeta,
    open,
    close,
    apply,
    reset,
  }
}
