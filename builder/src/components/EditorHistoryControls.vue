<script setup lang="ts">
import ToolbarIcon from '@/components/ToolbarIcon.vue'
defineProps<{ canUndo: boolean; canRedo: boolean; inspectorEnabled: boolean }>()
const emit = defineEmits<{ undo: []; redo: []; toggleInspector: [] }>()
</script>

<template>
  <div class="toolbar-cluster toolbar-history">
    <button type="button" aria-label="Undo" :disabled="!canUndo" @click="emit('undo')"><ToolbarIcon name="undo" /><span>Undo</span></button>
    <button type="button" aria-label="Redo" :disabled="!canRedo" @click="emit('redo')"><ToolbarIcon name="redo" /><span>Redo</span></button>
    <button type="button" aria-label="Inspector" data-tour="inspector" :aria-pressed="inspectorEnabled" :style="inspectorEnabled ? { backgroundColor: 'var(--color-builder-accent)', color: 'var(--color-builder-surface)', borderColor: 'var(--color-builder-accent)' } : undefined" @click="emit('toggleInspector')">
      <ToolbarIcon name="inspector" />Inspector<span v-if="inspectorEnabled" class="rounded-sm border border-current px-1 text-xs font-semibold" aria-hidden="true">On</span>
    </button>
  </div>
</template>
