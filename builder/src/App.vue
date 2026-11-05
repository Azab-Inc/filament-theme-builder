<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import HoverInspectPrototype from '@/components/HoverInspectPrototype.vue'
import BuilderShell from '@/components/BuilderShell.vue'

const params = new URLSearchParams(window.location.search)
const inspectMode = params.get('inspect') === '1'
const inspectVariant = params.get('variant') ?? 'A'
const visualMode = import.meta.env.DEV && params.get('visual-prototype') === '1' && !inspectMode
const dashboardMode = import.meta.env.DEV && params.get('dashboard-prototype') === '1' && !inspectMode && !visualMode
const guidelinesMode = import.meta.env.DEV && params.get('guidelines-prototype') === '1' && !inspectMode && !visualMode
const GuidelinesPrototype = guidelinesMode
  ? defineAsyncComponent(() => import('@/components/GuidelinesPrototype.vue'))
  : null
const VisualPrototype = visualMode
  ? defineAsyncComponent(() => import('@/components/BuilderVisualPrototype.vue'))
  : null
const DashboardPrototype = dashboardMode
  ? defineAsyncComponent(() => import('@/components/DashboardPrototype.vue'))
  : null
</script>

<template>
  <HoverInspectPrototype v-if="inspectMode" :initial-variant="inspectVariant" />
  <component :is="VisualPrototype" v-else-if="VisualPrototype" />
  <component :is="DashboardPrototype" v-else-if="DashboardPrototype" />
  <component :is="GuidelinesPrototype" v-else-if="GuidelinesPrototype" />
  <BuilderShell v-else />
</template>
