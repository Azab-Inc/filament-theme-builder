<script setup lang="ts">
import { onMounted } from 'vue'
import VisualPrototypeEditor from '@/components/VisualPrototypeEditor.vue'
import VisualPrototypeHeader from '@/components/VisualPrototypeHeader.vue'
import VisualPrototypeNavigation from '@/components/VisualPrototypeNavigation.vue'
import VisualPrototypePreview from '@/components/VisualPrototypePreview.vue'
import type { VisualPrototypeState } from '@/models/visual-prototype.model'
const props = defineProps<{ state: VisualPrototypeState }>()
onMounted(() => { props.state.expandedPalette.value = null })
</script>

<template><main class="vp-layout vp-canvas"><VisualPrototypeHeader :compact="true" />
  <div class="vp-canvas-tools"><strong>Preview canvas</strong><span>/ Admin panel · dashboard</span><div>Viewport controls in preview toolbar</div></div>
  <div class="vp-canvas-body"><VisualPrototypePreview /><aside class="vp-inspector"><VisualPrototypeNavigation horizontal :section="state.section.value" @select="state.section.value = $event" /><VisualPrototypeEditor :state="state" /></aside></div>
</main></template>
