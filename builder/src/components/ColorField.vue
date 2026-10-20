<script setup lang="ts">
import { computed, shallowRef, toRef, watch } from 'vue'
import ColorPopover from '@/components/ColorPopover.vue'
import { useColorField } from '@/composables/use-color-field'
import type { ColorFieldProfile } from '@/models/color-field.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import { isColorFieldValueValid } from '@/utils/color-field-validation'

const props = withDefaults(defineProps<{ id: string; label: string; value: string; effectiveValue: string; profile: ColorFieldProfile; contextKey: string; textLabel?: string; nativeLabel?: string; nativeId?: string; statusId?: string; errorId?: string; error?: string; resetKey?: string | number; nativePrimary?: boolean; property?: RawVisualProperty }>(), { textLabel: undefined, nativeLabel: undefined, nativeId: undefined, statusId: undefined, errorId: undefined, error: undefined, resetKey: undefined, nativePrimary: false, property: undefined })
const emit = defineEmits<{ input: [event: Event] }>()
const nativeInput = shallowRef<HTMLInputElement | null>(null)
const textInput = shallowRef<HTMLInputElement | null>(null)
const trigger = shallowRef<HTMLButtonElement | null>(null)
const value = toRef(props, 'value')
const profile = toRef(props, 'profile')
const contextKey = toRef(props, 'contextKey')
const resetKey = toRef(props, 'resetKey')
const { draft, open } = useColorField(value, profile, contextKey, resetKey)
const nativeSupported = computed(() => /^#[\da-f]{6}$/i.test(props.value) || (!props.value && /^#[\da-f]{6}$/i.test(props.effectiveValue)))
const nativeValue = computed(() => nativeSupported.value ? (props.value || props.effectiveValue) : '#000000')
const describedBy = computed(() => [props.statusId, props.errorId].filter(Boolean).join(' ') || undefined)
watch(() => props.value, (next) => { if (next === '' || isColorFieldValueValid(next, props.profile, props.property)) draft.value = next })
function forwardValue(next: string): void {
  if (!textInput.value) return
  textInput.value.value = next
  textInput.value.dispatchEvent(new Event('input', { bubbles: true }))
}
function onText(event: Event): void { draft.value = (event.target as HTMLInputElement).value; emit('input', event) }
function onNative(event: Event): void { draft.value = (event.target as HTMLInputElement).value; emit('input', event) }
function select(value: string): void { open.value = false; forwardValue(value) }
function toggle(): void { open.value = !open.value }
</script>

<template>
  <div class="color-field" :data-color-field="id">
    <label class="color-field__text-label" :for="id">{{ textLabel || label }}</label>
    <div class="color-field__controls">
      <input :id="nativeId || `${id}-native`" ref="nativeInput" class="color-field__native" :class="{ 'color-field__native--primary': nativePrimary }" type="color" :value="nativeValue" :disabled="!nativeSupported" :aria-label="nativeLabel || `${label} native color picker`" :aria-describedby="describedBy" @input="onNative" />
      <input :id="id" ref="textInput" v-model="draft" class="color-field__text" type="text" :aria-label="textLabel || label" :aria-describedby="describedBy" @input="onText" />
      <button :id="`${id}-palette-trigger`" ref="trigger" class="color-field__trigger" type="button" :aria-label="`Choose ${label} from Tailwind palette`" :aria-expanded="open" :aria-controls="`${id}-color-popover`" @click="toggle">Choose color</button>
    </div>
    <span v-if="!nativeSupported" class="color-field__native-help" role="status">Native color picker unavailable for this value.</span>
    <span v-if="error" :id="errorId" class="color-field__error" role="alert">{{ error }}</span>
    <ColorPopover :id="id" :label="label" :open="open" :value="draft" :profile="profile" :trigger-element="trigger" :property="property" @close="open = false" @select="select($event.value)" @apply="select" />
  </div>
</template>
