<script setup lang="ts">
import { ref, watch } from 'vue'
import { joinLengthValue, splitLengthValue } from '@/utils/raw-property-controls'

const props = defineProps<{ id: string; label: string; value: string; units: readonly string[]; step?: number; max?: number }>()
const emit = defineEmits<{ update: [value: string] }>()
const parsed = splitLengthValue(props.value, props.units)
const amount = ref(parsed.amount)
const unit = ref(parsed.unit)
const emitted = ref<string | null>(null)

watch(() => props.value, (value) => {
  if (value === emitted.value) return
  const next = splitLengthValue(value, props.units)
  amount.value = next.amount
  unit.value = next.unit
})

function commit(): void {
  if (!/^\d*\.?\d+$/.test(amount.value)) return
  const next = joinLengthValue(amount.value, unit.value)
  emitted.value = next
  emit('update', next)
}

function updateAmount(event: Event): void {
  amount.value = (event.target as HTMLInputElement).value
  commit()
}

function updateUnit(event: Event): void {
  unit.value = (event.target as HTMLSelectElement).value
  commit()
}
</script>

<template>
  <input
    :id="id"
    :name="id"
    type="number"
    inputmode="decimal"
    min="0"
    :max="max"
    :step="step ?? 0.1"
    autocomplete="off"
    :aria-label="label"
    :value="amount"
    @input="updateAmount"
  />
  <select :id="`${id}-unit`" :name="`${id}-unit`" :aria-label="`${label} unit`" :value="unit" @change="updateUnit">
    <option v-for="option in units" :key="option" :value="option">{{ option === '' ? 'unitless' : option }}</option>
  </select>
</template>
