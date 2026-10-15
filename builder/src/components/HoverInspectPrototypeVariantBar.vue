<script setup lang="ts">
import type { HoverInspectPrototypeVariant } from '@/models/hover-inspect-prototype-variant.model'

defineProps<{ activeVariant: HoverInspectPrototypeVariant; variants: HoverInspectPrototypeVariant[]; variantNames: Record<HoverInspectPrototypeVariant, string>; autoScroll: boolean }>()
const emit = defineEmits<{ select: [variant: HoverInspectPrototypeVariant]; step: [direction: number]; 'update:autoScroll': [value: boolean] }>()
</script>

<template>
  <nav class="inspect__variant-bar" aria-label="Inspection prototype variants">
    <button type="button" aria-label="Previous variant" @click="emit('step', -1)">←</button><span class="inspect__variant-current"><b>{{ activeVariant }}</b><span>{{ variantNames[activeVariant] }}</span></span>
    <div class="inspect__variant-choices"><button v-for="variant in variants" :key="variant" type="button" :aria-label="`Variant ${variant}`" :aria-current="activeVariant === variant ? 'true' : undefined" @click="emit('select', variant)">{{ variant }}</button></div>
    <label class="inspect__auto-scroll"><input :checked="autoScroll" type="checkbox" @change="emit('update:autoScroll', ($event.target as HTMLInputElement).checked)" /> Auto-scroll</label><span class="inspect__key-hint"><kbd>←</kbd><kbd>→</kbd> switch · <kbd>Esc</kbd> close</span><button type="button" aria-label="Next variant" @click="emit('step', 1)">→</button>
  </nav>
</template>
