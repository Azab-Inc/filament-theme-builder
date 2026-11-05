<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { CustomColorPanelProps, CustomColorPanelEmits } from '@/models/color-popover.model'
import { isColorFieldValueValid, isTransparentColorAllowed } from '@/utils/color-field-validation'

const props = defineProps<CustomColorPanelProps>()
const emit = defineEmits<CustomColorPanelEmits>()
const draft = shallowRef(props.value)
const nativeSupported = computed(() => /^#[\da-f]{6}$/i.test(draft.value))
const transparentAllowed = computed(() => !props.nativePrimary && isTransparentColorAllowed(props.profile, props.property))
const nativeValue = computed(() => nativeSupported.value ? draft.value : /^#[\da-f]{6}$/i.test(props.effectiveValue ?? '') ? props.effectiveValue : '#000000')
watch(() => props.value, (value) => { draft.value = value })
function apply(): void { if (isColorFieldValueValid(draft.value, props.profile, props.property)) emit('apply', draft.value) }
function draftNative(event: Event): void { draft.value = (event.target as HTMLInputElement).value }
</script>

<template>
  <div class="color-popover__custom">
    <button v-if="transparentAllowed" type="button" class="color-popover__transparent" data-color-choice="transparent" aria-label="Transparent" :aria-pressed="draft.toLowerCase() === 'transparent'" @click="emit('apply', 'transparent')">Transparent</button>
    <label :for="`${id}-custom-native`">Native color picker</label>
    <input :id="`${id}-custom-native`" type="color" :value="nativeValue" :aria-label="`${label} custom color picker`" @input="draftNative" @change="apply" />
    <button v-if="!nativeSupported && isColorFieldValueValid('#000000', profile, property)" type="button" @click="draft = '#000000'; apply()">Use black</button>
    <small v-if="!nativeSupported">Choose a color to replace the current value; it remains unchanged until you do.</small>
    <label :for="`${id}-custom-color`">Custom color</label>
    <input :id="`${id}-custom-color`" v-model="draft" type="text" :aria-label="`${label} custom color`" :name="`${id}-custom-color`" autocomplete="off" spellcheck="false" :aria-invalid="Boolean(draft && !isColorFieldValueValid(draft, profile, property))" :aria-describedby="draft && !isColorFieldValueValid(draft, profile, property) ? `${id}-custom-error` : undefined" />
    <p v-if="draft && !isColorFieldValueValid(draft, profile, property)" :id="`${id}-custom-error`" role="alert">Enter a valid color value.</p>
    <button type="button" :disabled="!isColorFieldValueValid(draft, profile, property)" @click="apply">Apply</button>
  </div>
</template>
