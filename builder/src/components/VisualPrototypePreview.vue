<script setup lang="ts">
import { computed, ref } from 'vue'
const demoUrl = import.meta.env.VITE_DEMO_URL || '/demo/admin'
const viewport = ref('Desktop')
const mode = ref('Light')
const frameStyle = computed(() => ({ maxWidth: viewport.value === 'Tablet' ? '820px' : viewport.value === 'Mobile' ? '390px' : 'none' }))
</script>

<template><section class="vp-preview" :class="`vp-preview--${mode.toLowerCase()}`"><div class="vp-preview-toolbar"><span><i></i> Reference preview</span><label>Viewport <select v-model="viewport" aria-label="Preview layout"><option>Desktop</option><option>Tablet</option><option>Mobile</option></select></label><label>Canvas <select v-model="mode" aria-label="Preview canvas mode"><option>Light</option><option>Dark</option></select></label></div>
  <p class="vp-disclosure">Reference preview — sandbox edits are not applied.</p><iframe :style="frameStyle" :src="demoUrl" title="Reference Filament panel preview" loading="lazy" sandbox="allow-same-origin allow-scripts allow-forms"></iframe></section></template>
