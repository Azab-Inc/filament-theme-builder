<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { CustomColorPanelProps, CustomColorPanelEmits } from '@/models/color-popover.model'
import { isColorFieldValueValid, isTransparentColorAllowed } from '@/utils/color-field-validation'

const props = defineProps<CustomColorPanelProps>()
const emit = defineEmits<CustomColorPanelEmits>()
const draft = shallowRef(props.value)
const nativeSupported = computed(() => /^#[\da-f]{6}$/i.test(draft.value))
const transparentAllowed = computed(() => !props.nativePrimary && isTransparentColorAllowed(props.profile, props.property))
watch(() => props.value, (value) => { draft.value = value })
function apply(): void { if (isColorFieldValueValid(draft.value, props.profile, props.property)) emit('apply', draft.value) }
function draftNative(event: Event): void { draft.value = (event.target as HTMLInputElement).value }
</script>

<template>
  <div class="color-popover__custom">
    <button v-if="transparentAllowed" type="button" class="color-popover__transparent" data-color-choice="transparent" aria-label="Transparent" :aria-pressed="draft.toLowerCase() === 'transparent'" @click="emit('apply', 'transparent')">Transparent</button>
    <label :for="`${id}-custom-native`">Native color picker</label>
    <input :id="`${id}-custom-native`" type="color" :value="nativeSupported ? draft : '#000000'" :disabled="!nativeSupported" :aria-label="`${label} custom color picker`" @input="draftNative" @change="apply" />
    <small v-if="!nativeSupported">This value is preserved. Enter a custom hex or choose a Tailwind shade to replace it.</small>
    <label :for="`${id}-custom-color`">Custom color</label>
    <input :id="`${id}-custom-color`" v-model="draft" type="text" :aria-label="`${label} custom color`" />
    <p v-if="draft && !isColorFieldValueValid(draft, profile, property)" role="alert">Enter a valid color value.</p>
    <button type="button" :disabled="!isColorFieldValueValid(draft, profile, property)" @click="apply">Apply</button>
  </div>
</template>
