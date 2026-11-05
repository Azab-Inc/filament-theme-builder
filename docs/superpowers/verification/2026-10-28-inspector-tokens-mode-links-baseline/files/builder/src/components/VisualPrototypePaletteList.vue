<script setup lang="ts">
import VisualPrototypePalette from '@/components/VisualPrototypePalette.vue'
import type { PaletteName, PaletteShade, PaletteState } from '@/models/foundations.model'
import { PALETTE_NAMES } from '@/models/foundations.model'

defineProps<{ palettes: Record<PaletteName, PaletteState>; open: PaletteName | null; counts: Record<PaletteName, number> }>()
const emit = defineEmits<{ toggle: [name: PaletteName]; base: [name: PaletteName, value: string]; shade: [name: PaletteName, shade: PaletteShade, value: string]; resetShade: [name: PaletteName, shade: PaletteShade]; resetBase: [name: PaletteName] }>()
</script>

<template>
  <div class="vp-palette-list"><VisualPrototypePalette v-for="name in PALETTE_NAMES" :key="name" :name="name" :palette="palettes[name]" :open="open === name" :edited="counts[name]"
    @toggle="emit('toggle', name)" @base="emit('base', name, $event)" @shade="emit('shade', name, $event.shade, $event.color)"
    @reset-shade="emit('resetShade', name, $event)" @reset-base="emit('resetBase', name)" /></div>
</template>
