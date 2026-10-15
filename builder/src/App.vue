<script setup lang="ts">
import HoverInspectPrototype from '@/components/HoverInspectPrototype.vue'
import BuilderShell from '@/components/BuilderShell.vue'
import type { EditorSection } from '@/models/editor.model'

const params = new URLSearchParams(window.location.search)
const inspectMode = params.get('inspect') === '1'
const inspectVariant = params.get('variant') ?? 'A'
</script>

<template>
  <HoverInspectPrototype v-if="inspectMode" :initial-variant="inspectVariant" />
  <BuilderShell v-else />
</template>
