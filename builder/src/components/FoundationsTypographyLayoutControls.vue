<script setup lang="ts">
import type { FoundationsTypographyLayoutControlsEmits } from '@/dtos/foundations-typography-layout-controls-emits.dto'
import type { FoundationsTypographyLayoutControlsProps } from '@/dtos/foundations-typography-layout-controls-props.dto'
import FoundationsTypographyControls from './FoundationsTypographyControls.vue'
import FoundationsLayoutControls from './FoundationsLayoutControls.vue'

const props = defineProps<FoundationsTypographyLayoutControlsProps>()
const emit = defineEmits<FoundationsTypographyLayoutControlsEmits>()
</script>

<template>
  <FoundationsTypographyControls
    v-bind="props"
    @set-font-choice="emit('set-font-choice', $event)"
    @set-font-name="emit('set-font-name', $event)"
    @reset="emit('reset', $event)"
  />
  <FoundationsLayoutControls
    v-bind="props"
    @set-density="emit('set-density', $event)"
    @set-number-foundation="emit('set-number-foundation', $event)"
    @set-select-foundation="emit('set-select-foundation', $event)"
    @reset="emit('reset', $event)"
  />
</template>
