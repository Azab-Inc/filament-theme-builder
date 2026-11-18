<script setup lang="ts">
import { ref } from 'vue'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ThemeMode } from '@/models/foundations.model'

const props = defineProps<{ selector: string; activeMode?: ThemeMode; propertyValue: (property: RawVisualProperty) => string }>()
const emit = defineEmits<{ 'set-properties': [changes: ReadonlyArray<{ property: RawVisualProperty; value: string }>]; 'reset-properties': [properties: ReadonlyArray<RawVisualProperty>] }>()
const side = ref<'all' | 'top' | 'right' | 'bottom' | 'left'>('all')
type EdgeProperty = 'color' | 'width' | 'style'
const property = ref<EdgeProperty>('width')
const sides = ['top', 'right', 'bottom', 'left'] as const
const raw = (side: typeof sides[number], property: EdgeProperty): RawVisualProperty => `border-${side}-${property}` as RawVisualProperty
function selected(): typeof sides[number][] { return side.value === 'all' ? [...sides] : [side.value] }
function displayedValue(edgeProperty: EdgeProperty): string {
  const values = sides.map((item) => props.propertyValue(raw(item, edgeProperty)))
  return values.every((value) => value === values[0]) ? values[0] ?? '' : ''
}
function set(event: Event): void {
  const value = (event.target as HTMLInputElement | HTMLSelectElement).value
  emit('set-properties', selected().map((item) => ({ property: raw(item, property.value), value })))
}
function reset(): void { emit('reset-properties', selected().map((item) => raw(item, property.value))) }
</script>

<template>
  <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4" :disabled="!selector" aria-label="Raw border edges">
    <legend>Raw border edges</legend>
    <div role="group" aria-label="Raw border side" class="flex flex-wrap gap-2">
      <button v-for="candidate in ['all', ...sides]" :key="candidate" type="button" :aria-pressed="side === candidate" @click="side = candidate as typeof side">{{ candidate === 'all' ? 'All sides' : candidate }}</button>
    </div>
    <label>Property<select v-model="property" aria-label="Raw border property"><option value="width">Width</option><option value="color">Color</option><option value="style">Style</option></select></label>
    <input v-if="property === 'width'" type="text" inputmode="decimal" aria-label="Raw border width" :value="side === 'all' ? displayedValue('width') : propertyValue(raw(side, 'width'))" @change="set" />
    <input v-else-if="property === 'color'" type="text" aria-label="Raw border color" :value="side === 'all' ? displayedValue('color') : propertyValue(raw(side, 'color'))" @change="set" />
    <select v-else aria-label="Raw border style" :value="side === 'all' ? displayedValue('style') : propertyValue(raw(side, 'style'))" @change="set"><option value="">Mixed</option><option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option></select>
    <button type="button" aria-label="Reset raw border" @click="reset">Reset</button>
  </fieldset>
</template>
