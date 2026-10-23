<script setup lang="ts">
import { ref, watch } from 'vue'
import { PADDING_UNITS } from '@/models/padding-registry.model'

const props = withDefaults(defineProps<{ value: string | null; id: string; ariaLabel: string; commitOnChange?: boolean }>(), { commitOnChange: true })
const emit = defineEmits<{ 'update:value': [value: string]; commit: [value: string] }>()
const number = ref('')
const unit = ref('px')
let lastEmitted = ''

function readValue(value: string | null): void {
  const match = /^(.*?)(px|rem|em|ex|ch|lh|rlh|vw|vh|vmin|vmax|%)$/.exec(value ?? '')
  number.value = match?.[1] ?? (value ?? '')
  unit.value = match?.[2] ?? 'px'
}
function value(): string { return number.value === '0' ? '0' : `${number.value}${unit.value}` }
function emitValue(): string { const next = value(); lastEmitted = next; emit('update:value', next); return next }
watch(() => props.value, (next) => { if (next !== lastEmitted) readValue(next) }, { immediate: true })
</script>

<template>
  <span class="inline-flex gap-1">
    <input :id="id" :aria-label="ariaLabel" :value="number" inputmode="decimal" @input="number = ($event.target as HTMLInputElement).value; emitValue()" @change="props.commitOnChange && emit('commit', emitValue())" />
    <select :aria-label="`${ariaLabel} unit`" :value="unit" @change="unit = ($event.target as HTMLSelectElement).value; emitValue()">
      <option v-for="option in PADDING_UNITS" :key="option" :value="option">{{ option }}</option>
    </select>
  </span>
</template>
