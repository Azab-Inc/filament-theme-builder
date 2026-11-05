<script setup lang="ts">
const emit = defineEmits<{ export: [] }>()
</script>

<template><header class="db-toolbar"><strong>Filament theme builder</strong><span>Dashboard-first live draft</span><button aria-label="Export draft JSON" @click="emit('export')">Export draft JSON</button></header></template>
