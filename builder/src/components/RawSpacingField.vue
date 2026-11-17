<script setup lang="ts">
import { ref, watch } from 'vue'
import { composeSpacingValue, parseSpacingValue } from '@/utils/raw-property-controls'

const props = defineProps<{ id: string; label: string; value: string; units: readonly string[]; step?: number }>()
const emit = defineEmits<{ update: [value: string] }>()
const sides = ['top', 'right', 'bottom', 'left'] as const
const parsed = parseSpacingValue(props.value)
const amounts = ref([...parsed.amounts])
const unit = ref(parsed.unit)
const emitted = ref<string | null>(null)

watch(() => props.value, (value) => {
  if (value === emitted.value) return
  const next = parseSpacingValue(value)
  amounts.value = [...next.amounts]
  unit.value = next.unit
})

function commit(): void {
  const next = composeSpacingValue(amounts.value, unit.value)
  if (!next) return
  emitted.value = next
  emit('update', next)
}

function updateAmount(index: number, event: Event): void {
  amounts.value = amounts.value.map((amount, position) => (position === index ? (event.target as HTMLInputElement).value : amount))
  commit()
}

function updateUnit(event: Event): void {
  unit.value = (event.target as HTMLSelectElement).value
  commit()
}
</script>

<template>
  <span class="raw-spacing-field">
    <input
      v-for="(side, index) in sides"
      :id="index === 0 ? id : `${id}-${side}`"
      :key="side"
      :name="`${id}-${side}`"
      type="number"
      inputmode="decimal"
      min="0"
      :step="step ?? 0.1"
      autocomplete="off"
      :aria-label="`${label} ${side}`"
      :value="amounts[index]"
      @input="updateAmount(index, $event)"
    />
    <select :id="`${id}-unit`" :name="`${id}-unit`" :aria-label="`${label} unit`" :value="unit" @change="updateUnit">
      <option v-for="option in units" :key="option" :value="option">{{ option }}</option>
    </select>
  </span>
</template>
