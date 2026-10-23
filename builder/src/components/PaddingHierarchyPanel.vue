<script setup lang="ts">
import { computed } from 'vue'
import type { PaddingReadResult, PaddingMutation, PaddingContext, PaddingReadRequest } from '@/models/padding.model'
import type { RegistryPaddingTarget } from '@/models/padding-registry.model'
import PaddingTargetRow from './PaddingTargetRow.vue'

type PaddingUiTarget = Pick<RegistryPaddingTarget, 'id' | 'sectionId' | 'status' | 'targetKind'> & { order?: number; units?: readonly string[]; variants?: readonly string[]; states?: readonly string[] }
const props = defineProps<{ targets: readonly PaddingUiTarget[]; read: (request: PaddingReadRequest) => PaddingReadResult; set: (mutation: PaddingMutation & { operation: 'set' }) => void; reset: (mutation: PaddingMutation & { operation: 'reset' }) => void }>()
const supported = computed(() => props.targets.filter((target) => target.status === 'supported').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
type ContextRow = { key: string; label: string; context: PaddingContext }
function contexts(target: PaddingUiTarget): ContextRow[] {
  const rows: ContextRow[] = []
  if (target.targetKind === 'leaf') rows.push({ key: 'global', label: 'Global', context: { scope: 'global' } }, { key: 'section', label: `Section · ${target.sectionId}`, context: { scope: 'section', sectionId: target.sectionId } })
  rows.push({ key: 'component', label: 'Component', context: { scope: 'component', targetId: target.id } })
  for (const variant of target.variants ?? []) rows.push({ key: `variant-${variant}`, label: `Variant · ${variant}`, context: { scope: 'variant', targetId: target.id, variantId: variant } })
  for (const state of target.states ?? []) rows.push({ key: `state-${state}`, label: `State · ${state}`, context: { scope: 'state', targetId: target.id, stateId: state } })
  return rows
}
</script>

<template>
  <section class="grid gap-4" aria-label="Hierarchical padding controls" data-padding-hierarchy>
    <h3>Padding</h3><p>Registry-supported targets inherit effective values until explicitly overridden.</p>
    <div v-for="section in [...new Set(supported.map((target) => target.sectionId))]" :key="section" class="grid gap-3">
      <h4>{{ section }}</h4>
      <template v-for="target in supported.filter((item) => item.sectionId === section)" :key="target.id">
        <PaddingTargetRow v-for="row in contexts(target)" :key="`${target.id}-${row.key}`" :target="target" :context="row.context" :context-key="`${target.id}-${row.key}`" :label="row.label" :read="props.read" :set="props.set" :reset="props.reset" />
      </template>
    </div>
  </section>
</template>
