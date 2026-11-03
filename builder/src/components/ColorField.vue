<script setup lang="ts">
import { computed, inject, shallowRef, toRef, watch, type Ref } from 'vue'
import ModeValueLink from './ModeValueLink.vue'
import ColorPopover from '@/components/ColorPopover.vue'
import { useColorField } from '@/composables/use-color-field'
import type { ColorFieldProps, ColorFieldEmits } from '@/models/color-field.model'
import { isColorFieldValueValid } from '@/utils/color-field-validation'
import ModeLinkControl from '@/components/ModeLinkControl.vue'
import { colorReferenceOptions, legacyPaletteReferenceLabel } from '@/utils/color-reference-options'

const props = withDefaults(defineProps<ColorFieldProps>(), { textLabel: undefined, visibleLabel: undefined, nativeLabel: undefined, nativeId: undefined, statusId: undefined, errorId: undefined, error: undefined, externalError: false, resetKey: undefined, nativePrimary: false, property: undefined })
const emit = defineEmits<ColorFieldEmits>()
const providedTokens = inject<Ref<string[]> | null>('user-token-options', null)
const providedColors = inject<Ref<Record<string, string>> | null>('theme-color-values', null)
const tokenOptions = computed(() => props.userTokenOptions ?? providedTokens?.value ?? [])
const referencesCompatible = computed(() => props.profile !== 'hex68' && !props.nativePrimary && (props.profile !== 'raw' || ['color', 'background-color', 'border-color'].includes(props.property ?? '')))
const referenceOptions = computed(() => referencesCompatible.value ? colorReferenceOptions(tokenOptions.value, providedColors?.value) : [])
const legacyReferenceLabel = computed(() => legacyPaletteReferenceLabel(props.value))
const selectedReferenceValue = computed(() => legacyReferenceLabel.value || referenceOptions.value.some((option) => option.value === props.value) ? props.value : '')
const referenceGroups = computed(() => [...new Set(referenceOptions.value.map((option) => option.group ?? 'Colors'))].map((name) => ({ name, options: referenceOptions.value.filter((option) => (option.group ?? 'Colors') === name) })))
const nativeInput = shallowRef<HTMLInputElement | null>(null)
const textInput = shallowRef<HTMLInputElement | null>(null)
const trigger = shallowRef<HTMLButtonElement | null>(null)
const value = toRef(props, 'value')
const profile = toRef(props, 'profile')
const contextKey = toRef(props, 'contextKey')
const resetKey = toRef(props, 'resetKey')
const { draft, open } = useColorField(value, profile, contextKey, resetKey)
const nativeSupported = computed(() => /^#[\da-f]{6}$/i.test(props.value) || (!props.value && /^#[\da-f]{6}$/i.test(props.effectiveValue)))
const nativeValue = computed(() => {
  if (nativeSupported.value) return props.value || props.effectiveValue
  const effective = providedColors?.value[props.value] ?? props.effectiveValue
  return /^#[\da-f]{6}$/i.test(effective) ? effective : '#000000'
})
const describedBy = computed(() => [props.statusId, props.error ? props.errorId : undefined].filter(Boolean).join(' ') || undefined)
const nativeDescribedBy = computed(() => [`${props.id}-label`, describedBy.value].filter(Boolean).join(' '))
watch(() => props.value, (next) => { if (next === '' || isColorFieldValueValid(next, props.profile, props.property)) draft.value = next })
function forwardValue(next: string): void {
  if (!textInput.value) return
  textInput.value.value = next
  textInput.value.dispatchEvent(new Event('input', { bubbles: true }))
}
function onInput(event: Event): void { draft.value = (event.target as HTMLInputElement).value; emit('input', event) }
function select(value: string): void { open.value = false; forwardValue(value) }
function toggle(): void { open.value = !open.value }
function chooseToken(event: Event): void { const select = event.target as HTMLSelectElement; if (select.value) forwardValue(select.value); else select.value = selectedReferenceValue.value }
</script>

<template>
  <div class="color-field" :data-color-field="id">
    <label :id="`${id}-label`" class="color-field__text-label" :for="id">{{ visibleLabel || textLabel || label }}</label>
    <div class="color-field__controls">
      <ModeLinkControl v-if="modeLink" :binding="modeLink" />
      <ModeValueLink v-else :target="modeTarget" />
      <label class="sr-only" :for="nativeId || `${id}-native`">{{ nativeLabel || `${label} native color picker` }}</label>
      <input :id="nativeId || `${id}-native`" :name="nativeId || `${id}-native`" autocomplete="off" ref="nativeInput" class="color-field__native" :class="{ 'color-field__native--primary': nativePrimary }" type="color" :value="nativeValue" :aria-label="nativeLabel || `${label} native color picker`" :aria-describedby="nativeDescribedBy" @input="onInput" />
      <input :id="id" ref="textInput" v-model="draft" class="color-field__text" :name="id" autocomplete="off" spellcheck="false" type="text" :aria-label="textLabel || label" :aria-describedby="describedBy" :aria-invalid="error ? 'true' : undefined" @input="onInput" />
      <button :id="`${id}-palette-trigger`" ref="trigger" class="color-field__trigger" type="button" :aria-label="`Choose ${label} from Tailwind palette`" :aria-expanded="open" :aria-controls="`${id}-color-popover`" @click="toggle">Choose color</button>
      <select v-if="referencesCompatible" class="color-field__token-select" :aria-label="`${label} named token`" :value="selectedReferenceValue" data-user-token-select @change="chooseToken"><option value="">Palette or token</option><option v-if="legacyReferenceLabel" :value="value">{{ legacyReferenceLabel }}</option><optgroup v-for="group in referenceGroups" :key="group.name" :label="group.name"><option v-for="option in group.options" :key="option.value" :value="option.value">{{ option.label }}</option></optgroup></select>
    </div>
    <span v-if="!nativeSupported" class="color-field__native-help" role="status">Choosing a native color replaces the current value.</span>
    <span v-if="error && !externalError" :id="errorId" class="color-field__error" role="alert">{{ error }}</span>
    <ColorPopover :id="id" :label="label" :open="open" :value="draft" :effective-value="nativeValue" :profile="profile" :trigger-element="trigger" :property="property" :reference-options="referenceOptions" @close="open = false" @select="select($event.value)" @apply="select" />
  </div>
</template>
