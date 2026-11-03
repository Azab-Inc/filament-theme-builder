<script setup lang="ts">
import type { ModeLinkBinding } from '@/models/mode-link-control.model'

defineProps<{ binding: ModeLinkBinding }>()
</script>

<template>
  <button type="button" class="mode-link-control" :aria-label="binding.linked ? `Unlock ${binding.label ?? binding.identity}` : `Link ${binding.label ?? binding.identity} between themes`" :aria-pressed="binding.linked" :disabled="binding.disabled" :title="binding.disabled ? 'Set a value before linking themes' : binding.linked ? 'Unlock for independent light/dark values' : 'Link both modes to the active value'" data-mode-link :data-mode-link-identity="binding.identity" @click="binding.toggle">
    {{ binding.linked ? '🔒' : '🔓' }}
  </button>
  <span v-if="binding.linked" class="sr-only">Reset to inherit clears the linked override in both themes and unlocks it.</span>
</template>
