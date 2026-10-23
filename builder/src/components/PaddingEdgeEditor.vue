<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PaddingEdges, PaddingEdge } from '@/models/padding.model'
import { PADDING_UNITS } from '@/models/padding-registry.model'
import { validatePaddingValue } from '@/utils/padding-validation'

const props = defineProps<{ linked: boolean; contextKey: string; contextLabel: string; edges: Record<PaddingEdge, string | null> }>()
const emit = defineEmits<{ set: [edges: PaddingEdges]; reset: [] }>()
const linkedValue = ref('')
const error = ref<string | null>(null)
const edgeNames: readonly PaddingEdge[] = ['top', 'right', 'bottom', 'left']
const isMixed = computed(() => new Set(Object.values(props.edges)).size > 1)
const displayValue = computed(() => linkedValue.value || (isMixed.value ? '' : props.edges.top ?? ''))
function validate(value: string): boolean { const result = validatePaddingValue(value, PADDING_UNITS, 'padding'); error.value = result.valid ? null : result.message; return result.valid }
function applyLinked(): void { const value = linkedValue.value || props.edges.top || '0'; if (validate(value)) emit('set', Object.fromEntries(edgeNames.map((edge) => [edge, value])) as PaddingEdges) }
function setEdge(edge: PaddingEdge, value: string): void { if (validate(value)) emit('set', { [edge]: value }) }
function link(): void { return }
</script>

<template>
  <div class="grid gap-2" data-padding-edge-editor>
    <span v-if="isMixed" role="status">Mixed</span>
    <p v-if="error" role="alert">{{ error }} Enter a value such as 54px.</p>
    <button v-if="!props.linked" type="button" aria-label="Link all edges" @click="link">Link all edges</button>
    <div v-if="props.linked" class="grid gap-1">
      <label :for="`padding-${props.contextKey}-linked`">{{ props.contextLabel }} · all edges</label>
       <input :id="`padding-${props.contextKey}-linked`" :aria-label="`${props.contextLabel} linked padding`" :placeholder="isMixed ? 'Mixed' : undefined" :value="displayValue" @input="error = null; linkedValue = ($event.target as HTMLInputElement).value" @keydown.enter="applyLinked" />
      <button type="button" :aria-label="`${props.contextLabel} apply linked padding`" @click="applyLinked">Apply linked padding</button>
    </div>
    <div v-else class="grid grid-cols-2 gap-1">
      <label v-for="edge in edgeNames" :key="edge" :for="`padding-${props.contextKey}-${edge}`">{{ props.contextLabel }} · {{ edge }} <input :id="`padding-${props.contextKey}-${edge}`" :aria-label="`${props.contextLabel} ${edge} padding`" :value="props.edges[edge] ?? ''" @change="setEdge(edge, ($event.target as HTMLInputElement).value)" /></label>
    </div>
    <button type="button" :aria-label="`${props.contextLabel} reset padding`" @click="emit('reset')">Reset to inherit</button>
  </div>
</template>
