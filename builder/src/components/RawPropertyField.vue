<script setup lang="ts">
import { computed } from 'vue'
import RawLengthField from './RawLengthField.vue'
import RawNumberField from './RawNumberField.vue'
import RawSelectField from './RawSelectField.vue'
import RawSpacingField from './RawSpacingField.vue'
import type { FoundationFontChoiceOption } from '@/models/foundation-font-choice-option.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import { fontFamilyOptions, rawPropertyControl } from '@/utils/raw-property-controls'

const props = defineProps<{
  id: string
  label: string
  property: RawVisualProperty
  value: string
  fontChoices: ReadonlyArray<FoundationFontChoiceOption>
}>()
const emit = defineEmits<{ update: [value: string] }>()
const control = computed(() => rawPropertyControl(props.property))
const length = computed(() => (control.value.kind === 'length' ? control.value : null))
const number = computed(() => (control.value.kind === 'number' ? control.value : null))
const spacing = computed(() => (control.value.kind === 'spacing' ? control.value : null))
const enumerated = computed(() => (control.value.kind === 'select' ? control.value.options : null))
const shadow = computed(() => (control.value.kind === 'shadow' ? control.value.options : null))
const fontFamilies = computed(() => fontFamilyOptions(props.fontChoices))
</script>

<template>
  <RawLengthField
    v-if="length"
    :id="id"
    :label="label"
    :value="value"
    :units="length.units"
    :step="length.step"
    :max="length.max"
    @update="emit('update', $event)"
  />
  <RawNumberField
    v-else-if="number"
    :id="id"
    :label="label"
    :value="value"
    :min="number.min"
    :max="number.max"
    :step="number.step"
    @update="emit('update', $event)"
  />
  <RawSpacingField
    v-else-if="spacing"
    :id="id"
    :label="label"
    :value="value"
    :units="spacing.units"
    :step="spacing.step"
    @update="emit('update', $event)"
  />
  <RawSelectField
    v-else-if="enumerated"
    :id="id"
    :label="label"
    :value="value"
    :options="enumerated"
    @update="emit('update', $event)"
  />
  <RawSelectField
    v-else-if="shadow"
    :id="id"
    :label="label"
    :value="value"
    :options="shadow"
    @update="emit('update', $event)"
  />
  <RawSelectField
    v-else
    :id="id"
    :label="label"
    :value="value"
    :options="fontFamilies"
    @update="emit('update', $event)"
  />
</template>
