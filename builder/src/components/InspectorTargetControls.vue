<script setup lang="ts">
import { computed } from 'vue'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'

const props = defineProps<{ evidence?: InspectorTargetEvidence | null; selector: string }>()
const emit = defineEmits<{ choose: [selector: string] }>()
const options = computed(() => {
  const values = [{ label: 'Picked element', selector: props.evidence?.targetSelector ?? '' }]
  if (props.evidence?.targetScope?.kind.startsWith('table-')) {
    values.push(...[
      ['Header cells', '.fi-ta-header-cell'], ['Body cells', '.fi-ta-cell'], ['Rows', '.fi-ta-row'],
      ['Table surface', '.fi-ta'], ['Table container', '.fi-ta-ctn'], ['Table heading surface', '.fi-ta-header'],
    ].map(([label, selector]) => ({ label: label!, selector: selector! })))
    if (props.evidence.targetScope.kind === 'table-column') {
      const index = props.evidence.targetScope.columnIndex
      values.push({ label: `Column ${index} — header and body`, selector: `.fi-ta :is(.fi-ta-header-cell, .fi-ta-cell):nth-child(${index})` })
    }
  }
  values.push(...(props.evidence?.surfaces ?? []))
  return values.filter((value, index) => value.selector && values.findIndex((candidate) => candidate.selector === value.selector) === index)
})
</script>

<template>
  <div class="grid gap-2">
    <label for="inspector-target-scope">Edit target</label>
    <select id="inspector-target-scope" aria-label="Inspector target scope" :value="selector" @change="emit('choose', ($event.target as HTMLSelectElement).value)">
      <option v-if="!options.some((option) => option.selector === selector)" :value="selector">Custom selector</option>
      <option v-for="option in options" :key="option.selector" :value="option.selector">{{ option.label }}</option>
    </select>
    <p v-if="evidence?.targetScope?.kind === 'table-column'" class="text-sm">Column positions include selection and action columns. This styles the same position in matching Filament tables.</p>
    <p v-if="evidence?.surfaces?.some((surface) => surface.selector.includes('chart'))" class="text-sm">Select a chart surface to edit its background. Canvas-drawn labels are not individual DOM targets.</p>
  </div>
</template>
