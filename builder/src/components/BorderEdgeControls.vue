<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { ThemeMode } from '@/models/foundations.model'
import type { BorderEdge, BorderProperty } from '@/models/border-edge.model'
import type { ThemeStateCurrent } from '@/models/theme.model'
import { createThemeRegistry } from '@/registry/theme-registry'
import { resolveBorderEdge } from '@/utils/border-edge-resolver'
import ColorField from '@/components/ColorField.vue'

const props = defineProps<{ targetId: string; activeMode: ThemeMode; label?: string; targetOptions?: readonly { id: string; label: string }[]; scope?: 'global' | 'component' | 'variant' | 'state'; componentId?: string; variantId?: string; stateId?: string }>()
const store = useThemeStore()
const registry = createThemeRegistry()
const side = ref<'all' | BorderEdge>('all')
const property = ref<BorderProperty>('width')
const edges = ['top', 'right', 'bottom', 'left'] as const
const selectedTarget = ref(props.targetId)
watch(() => props.targetId, (targetId) => { selectedTarget.value = targetId })
const value = computed(() => {
  const request = { targetId: selectedTarget.value, mode: props.activeMode, ...(props.componentId ? { componentId: props.componentId } : {}), ...(props.variantId ? { variantId: props.variantId } : {}), ...(props.stateId ? { stateId: props.stateId } : {}) }
  const values = edges.map((edge) => resolveBorderEdge(store.theme as unknown as ThemeStateCurrent, registry, request, edge, property.value).value)
  return side.value === 'all' ? values.every((item) => item === values[0]) ? values[0] : null : values[edges.indexOf(side.value)]
})
function setValue(event: Event): void {
  const raw = (event.target as HTMLInputElement).value
  let next: string | number = raw
  if (property.value === 'width') { const numeric = Number(raw); if (!Number.isFinite(numeric) || numeric < 0) return; next = numeric }
  const selected = side.value === 'all' ? edges : [side.value]
  store.setBorderEdges(selected.map((edge) => ({ targetId: selectedTarget.value, controlId: 'border', edge, property: property.value, scope: props.scope ?? 'global', ...(props.componentId ? { componentId: props.componentId } : {}), ...(props.variantId ? { variantId: props.variantId } : {}), ...(props.stateId ? { stateId: props.stateId } : {}), value: next, mode: props.activeMode })))
}
function reset(): void {
  const selected = side.value === 'all' ? edges : [side.value]
  store.resetBorderEdges(selected.map((edge) => ({ targetId: selectedTarget.value, controlId: 'border', edge, property: property.value, scope: props.scope ?? 'global', ...(props.componentId ? { componentId: props.componentId } : {}), ...(props.variantId ? { variantId: props.variantId } : {}), ...(props.stateId ? { stateId: props.stateId } : {}), mode: props.activeMode })))
}
</script>

<template>
  <fieldset class="editor-control-surface border-controls gap-2" role="group" :aria-label="label ?? 'Border'">
    <legend>{{ label ?? 'Border' }}</legend>
    <label v-if="targetOptions">Target<select v-model="selectedTarget" aria-label="Border target"><option v-for="target in targetOptions" :key="target.id" :value="target.id">{{ target.label }}</option></select></label>
    <div role="group" aria-label="Border side" class="border-controls__sides">
      <button v-for="candidate in ['all', ...edges]" :key="candidate" type="button" :aria-pressed="side === candidate" @click="side = candidate as 'all' | BorderEdge">{{ candidate === 'all' ? 'All sides' : candidate }}</button>
    </div>
    <label>Property<select v-model="property" aria-label="Border property"><option value="width">Width</option><option value="color">Color</option><option value="style">Style</option></select></label>
    <input v-if="property === 'width'" type="number" min="0" step="0.5" aria-label="Border width" :value="value ?? ''" @change="setValue" />
    <select v-else-if="property === 'style'" aria-label="Border style" :value="value ?? ''" @change="setValue"><option value="">Mixed</option><option value="none">None</option><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option><option value="double">Double</option></select>
    <ColorField v-else id="semantic-context-border-color" label="Border color" visible-label="Color" :value="typeof value === 'string' ? value : ''" :effective-value="typeof value === 'string' ? value : '#000000'" context-key="semantic-context-border" profile="foundation" @input="setValue" />
    <button type="button" aria-label="Reset border" @click="reset">Reset</button>
  </fieldset>
</template>
