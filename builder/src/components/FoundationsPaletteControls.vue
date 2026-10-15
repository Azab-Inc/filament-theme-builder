<script setup lang="ts">
import type { PaletteName, PaletteShade } from '@/models/foundations.model'
import type { FoundationsPaletteControlsEmits } from './foundations-palette-controls-emits.model'
import type { FoundationsPaletteControlsProps } from './foundations-palette-controls-props.model'

defineProps<FoundationsPaletteControlsProps>()
const emit = defineEmits<FoundationsPaletteControlsEmits>()

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
    <div
      v-for="name in paletteNames"
      :key="name"
      class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]"
    >
      <label :for="`${name}-palette-base`">{{ name }} palette base</label>
      <input
        :id="`${name}-palette-base`"
        type="text"
        :value="palettes[name].base"
        @input="setPaletteBase(name, $event)"
      />
      <span role="status" aria-live="polite">{{ statusFor(`palettes.${name}.base`) }}</span>
      <button
        type="button"
        :aria-label="`Reset ${name} palette base`"
        @click="emit('reset-palette-base', name)"
      >
        Reset
      </button>
      <template v-for="shade in paletteShades" :key="`${name}-${shade}`">
        <label :for="`${name}-shade-${shade}`">{{ name }} shade {{ shade }} override</label>
        <input
          :id="`${name}-shade-${shade}`"
          type="text"
          :aria-label="`${name} shade ${shade} override`"
          :value="palettes[name].overrides[shade] ?? ''"
          @input="setPaletteShade(name, shade, $event)"
        />
        <span role="status" aria-live="polite">{{
          statusFor(`palettes.${name}.shades.${shade}`)
        }}</span>
        <button
          type="button"
          :aria-label="`Reset ${name} shade ${shade}`"
          @click="emit('reset-palette-shade', { name, shade })"
        >
          Reset
        </button>
      </template>
    </div>
  </fieldset>
</template>
