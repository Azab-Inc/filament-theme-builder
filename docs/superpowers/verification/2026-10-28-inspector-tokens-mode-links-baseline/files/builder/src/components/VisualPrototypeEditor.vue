<script setup lang="ts">
import VisualPrototypePaletteList from '@/components/VisualPrototypePaletteList.vue'
import VisualPrototypeFoundationGroups from '@/components/VisualPrototypeFoundationGroups.vue'
import VisualPrototypeSection from '@/components/VisualPrototypeSection.vue'
import type { VisualPrototypeState } from '@/models/visual-prototype.model'
const props = defineProps<{ state: VisualPrototypeState; compact?: boolean }>()
const emit = defineEmits<{ selectPalette: [name: import('@/models/foundations.model').PaletteName] }>()
</script>

<template><div class="vp-editor"><div class="vp-editor-heading"><div><small>THEME TOKENS</small><h1>{{ state.section.value }}</h1></div><span class="vp-local-tag">Sandbox</span></div>
  <VisualPrototypePaletteList v-if="state.section.value === 'Foundations'" :palettes="state.theme.foundations.palettes" :open="state.expandedPalette.value" :counts="state.counts.value"
    @toggle="state.togglePalette" @base="state.setBase" @shade="state.setShade" @reset-shade="state.resetShade" @reset-base="state.resetBase" />
  <VisualPrototypeFoundationGroups v-if="state.section.value === 'Foundations'" :foundations="state.theme.foundations" />
  <VisualPrototypeSection v-else :section="state.section.value" />
</div></template>
