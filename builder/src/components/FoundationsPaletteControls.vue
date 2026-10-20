<script setup lang="ts">
import { ref } from 'vue'
import type { PaletteName, PaletteShade } from '@/models/foundations.model'
import type { FoundationsPaletteControlsEmits } from './foundations-palette-controls-emits.model'
import type { FoundationsPaletteControlsProps } from './foundations-palette-controls-props.model'

defineProps<FoundationsPaletteControlsProps>()
const emit = defineEmits<FoundationsPaletteControlsEmits>()
const openPalette = ref<PaletteName | null>(null)

function togglePalette(name: PaletteName): void {
  openPalette.value = openPalette.value === name ? null : name
}
function setPaletteBase(name: PaletteName, event: Event): void {
  emit('set-palette-base', { name, value: (event.target as HTMLInputElement).value })
}
function setPaletteShade(name: PaletteName, shade: PaletteShade, event: Event): void {
  emit('set-palette-shade', { name, shade, value: (event.target as HTMLInputElement).value })
}
</script>

<template>
  <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
    <legend>Color palettes</legend>
    <section v-for="name in paletteNames" :key="name" class="palette-accordion__item">
      <h3 class="palette-accordion__heading">
        <button :id="`${name}-palette-header`" type="button" class="palette-accordion__header" :aria-label="`${name[0]?.toUpperCase()}${name.slice(1)}`"
          :data-palette-header="name" :aria-expanded="openPalette === name"
          :aria-controls="`${name}-palette-panel`" @click="togglePalette(name)">
          <span class="palette-accordion__marker" :style="{ backgroundColor: palettes[name].base }" aria-hidden="true"></span>
          <span class="palette-accordion__name">{{ name }}</span>
          <span class="palette-accordion__base">{{ palettes[name].base }}</span>
          <span class="palette-accordion__ramp" aria-label="Generated shade ramp">
            <span v-for="shade in paletteShades" :key="shade" :style="{ backgroundColor: palettes[name].shades[shade] }" :title="`Shade ${shade}`"></span>
          </span>
          <span class="palette-accordion__summary">{{ Object.keys(palettes[name].overrides).length }} edited / {{ paletteShades.length - Object.keys(palettes[name].overrides).length }} generated</span>
        </button>
      </h3>
      <div v-if="openPalette === name" :id="`${name}-palette-panel`" class="palette-accordion__panel" :data-palette-panel="name" role="region" :aria-labelledby="`${name}-palette-header`">
        <div class="palette-accordion__base-editor">
          <label :for="`${name}-palette-base`">{{ name }} palette base</label>
          <input :id="`${name}-palette-base-picker`" type="color" :value="palettes[name].base" :aria-label="`${name} palette base color picker`" :aria-describedby="`${name}-base-status`" @input="setPaletteBase(name, $event)" />
          <input :id="`${name}-palette-base`" type="text" :value="palettes[name].base" :aria-label="`${name} palette base text`" :aria-describedby="`${name}-base-status`" @input="setPaletteBase(name, $event)" />
          <span :id="`${name}-base-status`" :data-palette-status="`${name}-base`" role="status">{{ statusFor(`palettes.${name}.base`) }}</span>
          <button type="button" :aria-label="`Reset ${name} palette base`" @click="emit('reset-palette-base', name)">Reset base</button>
        </div>
        <div class="palette-accordion__shade-grid">
          <div v-for="shade in paletteShades" :key="`${name}-${shade}`" class="palette-accordion__shade">
            <label :for="`${name}-shade-${shade}`">{{ shade }}</label>
            <span class="palette-accordion__shade-marker" :style="{ backgroundColor: palettes[name].shades[shade] }" aria-hidden="true"></span>
            <input :id="`${name}-shade-${shade}`" type="text" :aria-label="`${name} shade ${shade} override`" :value="palettes[name].overrides[shade] ?? ''" :aria-describedby="`${name}-shade-status-${shade}`" @input="setPaletteShade(name, shade, $event)" />
            <span :id="`${name}-shade-status-${shade}`" :data-palette-status="`${name}-shade-${shade}`" role="status">{{ statusFor(`palettes.${name}.shades.${shade}`) }}</span>
            <button type="button" :aria-label="`Reset ${name} shade ${shade}`" @click="emit('reset-palette-shade', { name, shade })">Reset</button>
          </div>
        </div>
      </div>
    </section>
  </fieldset>
</template>
