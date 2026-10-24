<script setup lang="ts">
defineProps<{ label: string; ariaLabel: string }>()
</script>

<template>
  <details class="toolbar-menu" data-toolbar-menu>
    <summary :aria-label="ariaLabel">{{ label }}</summary>
    <div class="toolbar-menu__panel"><slot /></div>
  </details>
</template>
