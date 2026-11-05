<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue'
import { useVisualPrototype } from '@/composables/use-visual-prototype'
import VisualPrototypeSwitcher from '@/components/VisualPrototypeSwitcher.vue'
import '@/styles/visual-prototype.css'

const keys = ['A', 'B', 'C'] as const
const names = { A: 'Studio', B: 'Canvas', C: 'Workbench' }
const variant = ref(keys.includes(new URLSearchParams(location.search).get('variant') as typeof keys[number]) ? new URLSearchParams(location.search).get('variant') as typeof keys[number] : 'A')
const state = useVisualPrototype()
watch(variant, (key) => { if (key === 'B') state.expandedPalette.value = null }, { immediate: true })
const view = computed(() => ({ A: defineAsyncComponent(() => import('@/components/VisualPrototypeVariantA.vue')), B: defineAsyncComponent(() => import('@/components/VisualPrototypeVariantB.vue')), C: defineAsyncComponent(() => import('@/components/VisualPrototypeVariantC.vue')) })[variant.value])
function updateVariant() {
  const requested = new URLSearchParams(location.search).get('variant')
  variant.value = keys.includes(requested as typeof keys[number]) ? requested as typeof keys[number] : 'A'
}
onMounted(() => window.addEventListener('popstate', updateVariant))
onUnmounted(() => window.removeEventListener('popstate', updateVariant))
</script>

<template><div class="visual-prototype-root"><component :is="view" :state="state" /><VisualPrototypeSwitcher :variant="variant" :name="names[variant]" :section="state.section.value" :open-palette="state.expandedPalette.value ?? 'none'" :edits="state.paletteEditCount.value" /></div></template>
