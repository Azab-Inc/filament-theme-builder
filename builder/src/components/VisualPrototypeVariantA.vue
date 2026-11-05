<script setup lang="ts">
import VisualPrototypeEditor from '@/components/VisualPrototypeEditor.vue'
import VisualPrototypeHeader from '@/components/VisualPrototypeHeader.vue'
import VisualPrototypeNavigation from '@/components/VisualPrototypeNavigation.vue'
import VisualPrototypePreview from '@/components/VisualPrototypePreview.vue'
import type { VisualPrototypeState } from '@/models/visual-prototype.model'
defineProps<{ state: VisualPrototypeState }>()
</script>

<template><main class="vp-layout vp-studio"><VisualPrototypeHeader />
  <div class="vp-studio-body"><VisualPrototypeNavigation :section="state.section.value" @select="state.section.value = $event" />
    <VisualPrototypeEditor :state="state" /><VisualPrototypePreview />
  </div></main></template>
