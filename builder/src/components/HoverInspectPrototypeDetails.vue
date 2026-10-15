<script setup lang="ts">
import type { CSSProperties } from 'vue'
import type { HoverInspectPrototypeTarget } from '@/models/hover-inspect-prototype-target.model'

defineProps<{ target: HoverInspectPrototypeTarget; pinned: boolean; anchored: boolean; anchoredStyle: CSSProperties }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <aside class="inspect__details" :class="{ 'inspect__details--anchored': anchored }" :style="anchored ? anchoredStyle : undefined" data-inspector-details aria-live="polite">
    <button type="button" class="inspect__close" aria-label="Close inspector" @click="emit('close')">×</button>
    <small>{{ pinned ? 'PINNED INSPECTION' : 'HOVER INSPECTION' }}</small><h2>{{ target.name }}</h2><p class="inspect__kind">{{ target.kind }}</p>
    <div v-if="target.section" class="inspect__mapping"><span>EDITOR MAPPING</span><b>{{ target.section }}</b></div>
    <div v-else class="inspect__unmapped-state"><b>Detected, but not mapped</b><span>No editor section is linked. This target will not scroll the editor.</span></div>
    <div class="inspect__detail-block"><span>DETECTED CLASSES</span><code v-for="className in target.classes" :key="className">.{{ className }}</code></div>
    <div v-if="target.editable.length" class="inspect__detail-block"><span>EDITABLE TOKENS</span><code v-for="token in target.editable" :key="token">{{ token }}</code></div>
    <div class="inspect__detail-footer">{{ pinned ? 'Click close or press Escape to unpin' : 'Click target to pin · Tab to inspect' }}</div>
  </aside>
</template>
