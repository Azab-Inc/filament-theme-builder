<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
const props = defineProps<{ variant: string; name: string; section: string; openPalette: string; edits: number }>()
const variants = ['A', 'B', 'C']
function switchTo(key: string) {
  const url = new URL(window.location.href)
  url.searchParams.set('visual-prototype', '1')
  url.searchParams.set('variant', key)
  window.history.replaceState({}, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
function cycle(delta: number) { switchTo(variants[(variants.indexOf(props.variant) + delta + variants.length) % variants.length]!) }
function onKeydown(event: KeyboardEvent) {
  const target = event.target
  if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); cycle(event.key === 'ArrowRight' ? 1 : -1) }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template><aside class="vp-switcher" aria-label="Throwaway prototype variant selector"><span>THROWAWAY PROTOTYPE</span><button aria-label="Previous variant" @click="cycle(-1)">←</button><strong>{{ variant }} · {{ name }}</strong><span class="vp-state-summary">{{ section }} · {{ openPalette }} open · {{ edits }} palette edits</span><button aria-label="Next variant" @click="cycle(1)">→</button><div class="vp-switcher-keys"><button v-for="key in variants" :key="key" :aria-pressed="key === variant" @click="switchTo(key)">{{ key }}</button></div></aside></template>
