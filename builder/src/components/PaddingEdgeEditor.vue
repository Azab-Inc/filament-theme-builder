<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PaddingEdges, PaddingEdge } from '@/models/padding.model'

const props = defineProps<{ linked: boolean; edges: Record<PaddingEdge, string | null> }>()
const emit = defineEmits<{ set: [edges: PaddingEdges]; reset: [] }>()
const linkedValue = ref('')
const edgeNames: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']
const isMixed = computed(() => new Set(Object.values(props.edges)).size > 1)
const displayValue = computed(() => linkedValue.value || (isMixed.value ? '' : props.edges.top ?? ''))
function applyLinked(): void { const value = linkedValue.value || props.edges.top || '0'; emit('set', Object.fromEntries(edgeNames.map((edge) => [edge, value])) as PaddingEdges) }
function setEdge(edge: PaddingEdge, value: string): void { emit('set', { [edge]: value }) }
function link(): void { return }
</script>

<template>
  <div class="grid gap-2" data-padding-edge-editor>
    <span v-if="isMixed" role="status">Mixed</span>
    <button v-if="!props.linked" type="button" aria-label="Link all edges" @click="link">Link all edges</button>
    <div v-if="props.linked" class="grid gap-1">
      <label for="linked-padding">All edges</label>
      <input id="linked-padding" aria-label="Linked padding" :placeholder="isMixed ? 'Mixed' : undefined" :value="displayValue" @input="linkedValue = ($event.target as HTMLInputElement).value" />
      <button type="button" aria-label="Apply linked padding" @click="applyLinked">Apply linked padding</button>
    </div>
    <div v-else class="grid grid-cols-2 gap-1">
      <label v-for="edge in edgeNames" :key="edge">{{ edge }} <input :aria-label="`${edge} padding`" :value="props.edges[edge] ?? ''" @change="setEdge(edge, ($event.target as HTMLInputElement).value)" /></label>
    </div>
    <button type="button" aria-label="Reset padding" @click="emit('reset')">Reset to inherit</button>
  </div>
</template>
