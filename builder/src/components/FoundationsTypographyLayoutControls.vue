<script setup lang="ts">
import { computed } from 'vue'
import type {
  FoundationSpacingName,
  FoundationTypographyName,
  FoundationsTypographyLayoutControlsEmits,
  FoundationsTypographyLayoutControlsProps,
} from './foundations-typography-layout-controls.model'

const props = defineProps<FoundationsTypographyLayoutControlsProps>()
const emit = defineEmits<FoundationsTypographyLayoutControlsEmits>()

const typographyNames: readonly FoundationTypographyName[] = ['body', 'heading', 'mono']
const radiusOptions = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const shadowOptions = ['none', 'sm', 'md', 'lg', 'xl'] as const
const spacingNames = computed(() => Object.keys(props.spacing) as FoundationSpacingName[])

function fontSelection(name: FoundationTypographyName): string {
  const font = props.typography[name]
  if (font.kind === 'custom') return 'custom'
  if (font.kind === 'curated') return `curated:${font.name}`
  return font.name === 'System Mono' ? 'system-mono' : 'system'
}
</script>

<template>
  <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
    <legend>Typography</legend>
    <div v-for="name in typographyNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label :for="`${name}-font-kind`">{{ name }} font type</label>
      <select
        :id="`${name}-font-kind`"
        :aria-label="`${name} font type`"
        :value="fontSelection(name)"
        @change="emit('set-font-choice', { name, event: $event })"
      >
        <option v-for="choice in fontChoices" :key="choice.value" :value="choice.value">
          {{ choice.label }}
        </option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor(`typography.${name}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset ${name} font`"
        @click="emit('reset', `typography.${name}`)"
      >
        Reset
      </button>
      <label :for="`${name}-font-name`">{{ name }} font name</label>
      <input
        :id="`${name}-font-name`"
        type="text"
        :aria-label="`${name} font name`"
        :value="typography[name].name"
        @input="emit('set-font-name', { name, event: $event })"
      />
    </div>
    <p>Font names are stored only; the builder never loads or hosts font files.</p>
  </fieldset>

  <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
    <legend>Layout foundations</legend>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="density">Density</label>
      <select
        id="density"
        :value="density"
        @change="emit('set-density', ($event.target as HTMLSelectElement).value as typeof density)"
      >
        <option value="compact">Compact</option>
        <option value="default">Default</option>
        <option value="spacious">Spacious</option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor('density') }}</span>
      <button type="button" aria-label="Reset density" @click="emit('reset', 'density')">Reset</button>
    </div>
    <div role="group" aria-label="Density presets">
      <button type="button" aria-label="Compact density" @click="emit('set-density', 'compact')">
        Compact
      </button>
      <button type="button" aria-label="Default density" @click="emit('set-density', 'default')">
        Default
      </button>
      <button type="button" aria-label="Spacious density" @click="emit('set-density', 'spacious')">
        Spacious
      </button>
    </div>
    <div v-for="key in spacingNames" :key="key" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label :for="`spacing-${key.replace('.', '-')}`">Spacing {{ key }}</label>
      <input
        :id="`spacing-${key.replace('.', '-')}`"
        type="number"
        min="0"
        max="256"
        :aria-label="`Spacing ${key}`"
        :value="spacing[key]"
        @input="emit('set-number-foundation', { path: `spacing.${key}`, event: $event })"
      />
      <span role="status" aria-live="polite">{{ statusFor(`spacing.${key}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset spacing ${key}`"
        @click="emit('reset', `spacing.${key}`)"
      >
        Reset
      </button>
    </div>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="radius">Radius</label>
      <select
        id="radius"
        :value="radius"
        @change="emit('set-select-foundation', { path: 'radius', event: $event })"
      >
        <option v-for="value in radiusOptions" :key="value" :value="value">{{ value }}</option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor('radius') }}</span>
      <button type="button" aria-label="Reset radius" @click="emit('reset', 'radius')">Reset</button>
    </div>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="border-width">Border width</label>
      <input
        id="border-width"
        type="number"
        min="0"
        max="8"
        :value="borderWidth"
        @input="emit('set-number-foundation', { path: 'borderWidth', event: $event })"
      />
      <span role="status" aria-live="polite">{{ statusFor('borderWidth') }}</span>
      <button type="button" aria-label="Reset border width" @click="emit('reset', 'borderWidth')">
        Reset
      </button>
    </div>
    <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label for="shadow">Shadow</label>
      <select
        id="shadow"
        :value="shadow"
        @change="emit('set-select-foundation', { path: 'shadow', event: $event })"
      >
        <option v-for="value in shadowOptions" :key="value" :value="value">{{ value }}</option>
      </select>
      <span role="status" aria-live="polite">{{ statusFor('shadow') }}</span>
      <button type="button" aria-label="Reset shadow" @click="emit('reset', 'shadow')">Reset</button>
    </div>
  </fieldset>
</template>
