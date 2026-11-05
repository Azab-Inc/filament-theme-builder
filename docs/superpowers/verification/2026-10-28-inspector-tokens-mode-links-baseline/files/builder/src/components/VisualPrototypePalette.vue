<script setup lang="ts">
import { PALETTE_SHADES } from '@/models/foundations.model'
import type { PaletteName, PaletteShade, PaletteState } from '@/models/foundations.model'

const props = defineProps<{ name: PaletteName; palette: PaletteState; open: boolean; edited: number }>()
const emit = defineEmits<{ toggle: []; base: [value: string]; shade: [value: { shade: PaletteShade; color: string }]; resetShade: [shade: PaletteShade]; resetBase: [] }>()
</script>

<template>
  <section class="vp-palette">
    <button class="vp-palette-head" :aria-expanded="open" @click="emit('toggle')">
      <span class="vp-color-dot" :style="{ '--vp-swatch': palette.base }"></span>
      <strong>{{ name }}</strong><code>{{ palette.base }}</code>
      <span class="vp-ramp"><i v-for="shade in PALETTE_SHADES" :key="shade" :style="{ background: palette.shades[shade] }"></i></span>
      <small>{{ edited ? `${edited} edited` : 'generated' }}</small><span aria-hidden="true">{{ open ? '−' : '+' }}</span>
    </button>
    <div v-if="open" class="vp-palette-body">
      <label class="vp-base-label">Base color <input aria-label="Base color picker" type="color" :value="palette.base" @input="emit('base', ($event.target as HTMLInputElement).value)">
        <input class="vp-base-hex" aria-label="Base hex value" type="text" :value="palette.base" @change="emit('base', ($event.target as HTMLInputElement).value)"></label>
      <button class="vp-text-button" @click="emit('resetBase')">Reset base</button>
      <div class="vp-shades"><label v-for="shade in PALETTE_SHADES" :key="shade" class="vp-shade">
        <span>{{ shade }}</span><input :aria-label="`${name} ${shade} shade`" type="color" :value="palette.shades[shade]" @input="emit('shade', { shade, color: ($event.target as HTMLInputElement).value })">
        <button v-if="palette.overrides[shade]" :aria-label="`Reset ${name} ${shade} shade`" @click="emit('resetShade', shade)">↺</button>
      </label></div>
    </div>
  </section>
</template>
