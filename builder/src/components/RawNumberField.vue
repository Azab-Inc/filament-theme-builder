<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ id: string; label: string; value: string; min: number; max: number; step: number }>()
const emit = defineEmits<{ update: [value: string] }>()
const amount = ref(props.value)
const emitted = ref<string | null>(null)

watch(() => props.value, (value) => {
  if (value === emitted.value) return
  amount.value = value
})

function update(event: Event): void {
  amount.value = (event.target as HTMLInputElement).value
  if (amount.value === '' || !Number.isFinite(Number(amount.value))) return
  emitted.value = amount.value
  emit('update', amount.value)
}
</script>

<template>
  <input
    :id="id"
    :name="id"
    type="number"
    inputmode="decimal"
    :min="min"
    :max="max"
    :step="step"
    autocomplete="off"
    :aria-label="label"
    :value="amount"
    @input="update"
  />
</template>
