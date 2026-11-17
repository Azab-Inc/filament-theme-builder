<script setup lang="ts">
import { computed } from 'vue'
import type { RawPropertyOption } from '@/models/raw-property-control.model'

const props = defineProps<{ id: string; label: string; value: string; options: readonly RawPropertyOption[] }>()
const emit = defineEmits<{ update: [value: string] }>()
const options = computed<RawPropertyOption[]>(() => {
  const known = props.options.some((option) => option.value === props.value)
  return props.value && !known ? [{ value: props.value, label: props.value }, ...props.options] : [...props.options]
})

function update(event: Event): void {
  emit('update', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <select :id="id" :name="id" :aria-label="label" :value="value" @change="update">
    <option v-if="!value" value="" disabled>Inherited</option>
    <option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option>
  </select>
</template>
