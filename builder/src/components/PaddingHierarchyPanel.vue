<script setup lang="ts">
import { computed } from 'vue'
import type { PaddingReadResult, PaddingMutation, PaddingContext } from '@/models/padding.model'
import type { RegistryPaddingTarget } from '@/models/padding-registry.model'
import PaddingTargetRow from './PaddingTargetRow.vue'

type PaddingUiTarget = Pick<RegistryPaddingTarget, 'id' | 'sectionId' | 'status' | 'targetKind'> & { order?: number; units?: readonly string[]; variants?: readonly string[]; states?: readonly string[] }
const props = defineProps<{ targets: readonly PaddingUiTarget[]; read: (request: { targetId: string; selectedContext: PaddingContext }) => PaddingReadResult; set: (mutation: PaddingMutation & { operation: 'set' }) => void; reset: (mutation: PaddingMutation & { operation: 'reset' }) => void }>()
const supported = computed(() => props.targets.filter((target) => target.status === 'supported').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))
</script>

<template>
  <section class="grid gap-4" aria-label="Hierarchical padding controls" data-padding-hierarchy>
    <h3>Padding</h3><p>Registry-supported targets inherit effective values until explicitly overridden.</p>
    <div v-for="section in [...new Set(supported.map((target) => target.sectionId))]" :key="section" class="grid gap-3">
      <h4>{{ section }}</h4>
      <PaddingTargetRow v-for="target in supported.filter((item) => item.sectionId === section)" :key="target.id" :target="target" :read="props.read" :set="props.set" :reset="props.reset" />
    </div>
  </section>
</template>
