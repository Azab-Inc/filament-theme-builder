<script setup lang="ts">
import { computed } from 'vue'
import type { FoundationSpacingName } from '@/models/foundation-spacing-name.model'
import type { FoundationsTypographyLayoutControlsEmits } from '@/dtos/foundations-typography-layout-controls-emits.dto'
import type { FoundationsTypographyLayoutControlsProps } from '@/dtos/foundations-typography-layout-controls-props.dto'

const props = defineProps<FoundationsTypographyLayoutControlsProps>()
const emit = defineEmits<FoundationsTypographyLayoutControlsEmits>()
const spacingNames = computed(() => Object.keys(props.spacing) as FoundationSpacingName[])
const radiusOptions = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const shadowOptions = ['none', 'sm', 'md', 'lg', 'xl'] as const
</script>

<template>
  <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
    <legend>Layout foundations</legend>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="density">Density</label>
      <select id="density" :value="density" @change="emit('set-density', ($event.target as HTMLSelectElement).value as typeof density)">
        <option value="compact">Compact</option>
        <option value="default">Default</option>
        <option value="spacious">Spacious</option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor('density') }}</span>
      <button type="button" aria-label="Reset density" @click="emit('reset', 'density')">Reset</button>
    </div>
    <div role="group" aria-label="Density presets">
      <button type="button" aria-label="Compact density" @click="emit('set-density', 'compact')">Compact</button>
      <button type="button" aria-label="Default density" @click="emit('set-density', 'default')">Default</button>
      <button type="button" aria-label="Spacious density" @click="emit('set-density', 'spacious')">Spacious</button>
    </div>
    <div v-for="key in spacingNames" :key="key" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label :for="`spacing-${key.replace('.', '-')}`">Spacing {{ key }}</label>
      <input :id="`spacing-${key.replace('.', '-')}`" type="number" min="0" max="256" :aria-label="`Spacing ${key}`" :value="spacing[key]" @input="emit('set-number-foundation', { path: `spacing.${key}`, event: $event })" />
      <span role="status" aria-live="polite">{{ statusFor(`spacing.${key}`) }}</span>
      <button type="button" :aria-label="`Reset spacing ${key}`" @click="emit('reset', `spacing.${key}`)">Reset</button>
    </div>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="radius">Radius</label>
      <select id="radius" :value="radius" @change="emit('set-select-foundation', { path: 'radius', event: $event })">
        <option v-for="value in radiusOptions" :key="value" :value="value">{{ value }}</option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor('radius') }}</span>
      <button type="button" aria-label="Reset radius" @click="emit('reset', 'radius')">Reset</button>
    </div>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="border-width">Border width</label>
      <input id="border-width" type="number" min="0" max="8" :value="borderWidth" @input="emit('set-number-foundation', { path: 'borderWidth', event: $event })" />
      <span role="status" aria-live="polite">{{ statusFor('borderWidth') }}</span>
      <button type="button" aria-label="Reset border width" @click="emit('reset', 'borderWidth')">Reset</button>
    </div>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="shadow">Shadow</label>
      <select id="shadow" :value="shadow" @change="emit('set-select-foundation', { path: 'shadow', event: $event })">
        <option v-for="value in shadowOptions" :key="value" :value="value">{{ value }}</option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor('shadow') }}</span>
      <button type="button" aria-label="Reset shadow" @click="emit('reset', 'shadow')">Reset</button>
    </div>
  </fieldset>
</template>
