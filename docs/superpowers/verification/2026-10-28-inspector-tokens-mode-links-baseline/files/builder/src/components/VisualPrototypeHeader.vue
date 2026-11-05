<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>

<template>
  <header class="vp-header"><div class="vp-brand"><span class="vp-mark">F</span><strong>Filament Theme Builder</strong><small>by Azaber · open source</small></div>
    <div v-if="!compact" class="vp-theme-title"><strong>Untitled theme</strong><span>Local sandbox</span></div>
    <div class="vp-header-actions"><button disabled title="Unavailable in prototype">↶</button><button disabled title="Unavailable in prototype">↷</button><button disabled title="Theme management is not active in the prototype">Themes</button><button disabled>Save</button><button disabled>Import</button><button disabled>Export</button><button disabled title="Unavailable in prototype">More</button></div>
  </header>
</template>
