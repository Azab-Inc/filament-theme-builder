<script setup lang="ts">
import { shallowRef, watch } from 'vue'
import type { ColorFieldProfile } from '@/utils/color-field-validation'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import { isColorFieldValueValid } from '@/utils/color-field-validation'

const props = defineProps<{ value: string; profile: ColorFieldProfile; label: string; property?: RawVisualProperty }>()
const emit = defineEmits<{ apply: [value: string] }>()
const draft = shallowRef(props.value)
watch(() => props.value, (value) => { draft.value = value })
function apply(): void { if (isColorFieldValueValid(draft.value, props.profile, props.property)) emit('apply', draft.value) }
</script>

<template>
  <div class="color-popover__custom">
    <label :for="`custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`">Custom color</label>
    <input :id="`custom-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`" v-model="draft" type="text" :aria-label="`${label} custom color`" />
    <p v-if="draft && !isColorFieldValueValid(draft, profile, property)" role="alert">Enter a valid color value.</p>
    <button type="button" :disabled="!isColorFieldValueValid(draft, profile, property)" @click="apply">Apply</button>
  </div>
</template>
