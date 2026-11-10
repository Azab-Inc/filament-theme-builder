<script setup lang="ts">
import ToolbarIcon from '@/components/ToolbarIcon.vue'
import type { ThemeMode } from '@/models/foundations.model'
defineProps<{ mode: ThemeMode; variant: 'segmented' | 'switch' | 'compact' }>()
const emit = defineEmits<{ change: [mode: ThemeMode] }>()
</script>

<template>
  <div v-if="variant === 'segmented'" class="toolbar-mode-segments" role="group" aria-label="Preview appearance">
    <button type="button" aria-label="Light mode" :aria-pressed="mode === 'light'" @click="emit('change', 'light')"><ToolbarIcon name="sun" />Light</button>
    <button type="button" aria-label="Dark mode" :aria-pressed="mode === 'dark'" @click="emit('change', 'dark')"><ToolbarIcon name="moon" />Dark</button>
  </div>
  <button v-else-if="variant === 'switch'" type="button" class="toolbar-appearance-switch" role="switch" aria-label="Dark mode" :aria-checked="mode === 'dark'" @click="emit('change', mode === 'light' ? 'dark' : 'light')">
    <ToolbarIcon name="sun" /><span class="toolbar-switch-track"><span class="toolbar-switch-thumb" /></span><ToolbarIcon name="moon" />
  </button>
  <button v-else type="button" class="toolbar-appearance-compact" role="switch" aria-label="Dark mode" :aria-checked="mode === 'dark'" @click="emit('change', mode === 'light' ? 'dark' : 'light')">
    <ToolbarIcon :name="mode === 'light' ? 'sun' : 'moon'" />{{ mode === 'light' ? 'Light' : 'Dark' }}<span class="toolbar-switch-track"><span class="toolbar-switch-thumb" /></span>
  </button>
</template>
