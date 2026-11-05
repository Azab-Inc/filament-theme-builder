<script setup lang="ts">
import VisualPrototypeEditor from '@/components/VisualPrototypeEditor.vue'
import VisualPrototypeHeader from '@/components/VisualPrototypeHeader.vue'
import VisualPrototypeNavigation from '@/components/VisualPrototypeNavigation.vue'
import VisualPrototypePreview from '@/components/VisualPrototypePreview.vue'
import type { VisualPrototypeState } from '@/models/visual-prototype.model'
defineProps<{ state: VisualPrototypeState }>()
</script>

<template><main class="vp-layout vp-workbench"><VisualPrototypeHeader />
  <VisualPrototypeNavigation horizontal :section="state.section.value" @select="state.section.value = $event" />
  <div class="vp-workbench-preview"><VisualPrototypePreview /></div>
  <section class="vp-dock"><div class="vp-dock-title"><div><small>WORKING SET</small><h2>{{ state.section.value }} controls</h2></div><span>Sandbox · memory only</span></div>
    <VisualPrototypeEditor :state="state" compact />
  </section></main></template>
