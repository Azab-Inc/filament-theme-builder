<script setup lang="ts">
import { ref, toRef } from 'vue'
import type { PaddingEdge, RegistryPaddingTarget } from '@/models/padding-registry.model'
import type { PaddingContext, PaddingMutation, PaddingReadResult } from '@/models/padding.model'
import { usePaddingEditor } from '@/composables/use-padding-editor'
import PaddingEdgeEditor from './PaddingEdgeEditor.vue'

type PaddingUiTarget = Pick<RegistryPaddingTarget, 'id' | 'sectionId' | 'status' | 'targetKind'> & { order?: number; units?: readonly string[] }
const props = defineProps<{ target: PaddingUiTarget; read: (request: { targetId: string; selectedContext: PaddingContext }) => PaddingReadResult; set: (mutation: PaddingMutation & { operation: 'set' }) => void; reset: (mutation: PaddingMutation & { operation: 'reset' }) => void }>()
const linked = ref(true)
const editor = usePaddingEditor(toRef(props, 'target'), props.read, props.set, props.reset)
const edges = editor.edges
const sources = editor.sources
const sourceText = (edge: PaddingEdge): string => sources.value[edge] === 'native' ? 'Native fallback' : `Source: ${sources.value[edge]}`
</script>

<template>
  <article class="grid gap-2 rounded border p-3" :data-padding-target="target.id">
    <h4>{{ target.id }}</h4>
    <div class="grid grid-cols-2 gap-2 text-sm"><span v-for="edge in ['top', 'right', 'bottom', 'left']" :key="edge"><strong>{{ edge }}</strong>: {{ edges[edge as PaddingEdge] ?? 'Native' }} · {{ sourceText(edge as PaddingEdge) }}</span></div>
    <button type="button" :aria-label="`${linked ? 'Edit separate' : 'Link'} ${target.id} edges`" @click="linked = !linked">{{ linked ? 'Edit separate edges' : 'Link all edges' }}</button>
    <PaddingEdgeEditor :linked="linked" :edges="edges" @set="editor.setEdges" @reset="editor.resetEdges" />
    <button type="button" :aria-label="`Reset ${target.id} padding`" @click="editor.resetEdges()">Reset to inherit</button>
  </article>
</template>
