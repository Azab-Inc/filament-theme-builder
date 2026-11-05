<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { GuidelineVariant } from '@/models/guidelines-prototype.model'
const props = defineProps<{ variant: GuidelineVariant; navigate: (delta: number) => void }>()
const labels: Record<GuidelineVariant, string> = { actions: 'Action hierarchy', navigation: 'Findable settings', tokens: 'Contextual tokens', keyboard: 'Keyboard wayfinding', mobile: 'Mobile workspaces' }
function cycle(event: KeyboardEvent) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, select, textarea, [contenteditable="true"], dialog')) return
  if (event.key === 'ArrowLeft') { event.preventDefault(); props.navigate(-1) }
  if (event.key === 'ArrowRight') { event.preventDefault(); props.navigate(1) }
}
onMounted(() => addEventListener('keydown', cycle))
onUnmounted(() => removeEventListener('keydown', cycle))
</script>
<template>
  <nav class="gp-switcher" aria-label="Prototype navigation"><span>Prototype · Changes are not saved</span><button aria-label="Previous prototype" @click="props.navigate(-1)">←</button><strong>{{ labels[props.variant] }}</strong><button aria-label="Next prototype" @click="props.navigate(1)">→</button></nav>
</template>
