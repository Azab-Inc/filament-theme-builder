<script setup lang="ts">
import type { FoundationsSurfaceControlsEmits } from '@/dtos/foundations-surface-controls-emits.dto'
import type { FoundationsSurfaceControlsProps } from '@/dtos/foundations-surface-controls-props.dto'

defineProps<FoundationsSurfaceControlsProps>()
const emit = defineEmits<FoundationsSurfaceControlsEmits>()
</script>

<template>
  <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
    <legend>Surfaces, borders, text, and modes</legend>
    <div role="group" aria-label="Preview mode">
      <button
        type="button"
        aria-label="Light mode"
        :aria-pressed="activeMode === 'light'"
        @click="emit('set-mode', 'light')"
      >
        Light
      </button>
      <button
        type="button"
        aria-label="Dark mode"
        :aria-pressed="activeMode === 'dark'"
        @click="emit('set-mode', 'dark')"
      >
        Dark
      </button>
    </div>
    <div v-for="name in surfaceNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label :for="`${name}-surface`">{{ name }} surface {{ activeMode }}</label>
      <input
        :id="`${name}-surface`"
        type="text"
        :value="surfaces[name]"
        :aria-invalid="foundationError(`surfaces.${name}.${activeMode}`) ? 'true' : undefined"
        @input="emit('set-mode-value', { path: `surfaces.${name}`, event: $event })"
      />
      <span role="status" aria-live="polite">{{ statusFor(`surfaces.${name}`) }}</span>
      <span v-if="foundationError(`surfaces.${name}.${activeMode}`)" :data-foundation-error="`surfaces.${name}.${activeMode}`" role="alert">{{ foundationError(`surfaces.${name}.${activeMode}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset ${name} surface`"
        @click="emit('reset', `surfaces.${name}.${activeMode}`)"
      >
        Reset
      </button>
    </div>
    <div v-for="name in borderNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label :for="`border-${name}-${activeMode}`">border {{ name }} {{ activeMode }}</label>
      <input
        :id="`border-${name}-${activeMode}`"
        type="text"
        :aria-label="`Border ${name} ${activeMode}`"
        :value="borders[name]"
        :aria-invalid="foundationError(`borders.${name}.${activeMode}`) ? 'true' : undefined"
        @input="emit('set-mode-value', { path: `borders.${name}`, event: $event })"
      />
      <span role="status" aria-live="polite">{{ statusFor(`borders.${name}`) }}</span>
      <span v-if="foundationError(`borders.${name}.${activeMode}`)" :data-foundation-error="`borders.${name}.${activeMode}`" role="alert">{{ foundationError(`borders.${name}.${activeMode}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset border ${name} ${activeMode}`"
        @click="emit('reset', `borders.${name}.${activeMode}`)"
      >
        Reset
      </button>
    </div>
    <div v-for="name in textNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <label :for="`text-${name}-${activeMode}`">text {{ name }} {{ activeMode }}</label>
      <input
        :id="`text-${name}-${activeMode}`"
        type="text"
        :aria-label="`Text ${name} ${activeMode}`"
        :value="text[name]"
        :aria-invalid="foundationError(`text.${name}.${activeMode}`) ? 'true' : undefined"
        @input="emit('set-mode-value', { path: `text.${name}`, event: $event })"
      />
      <span role="status" aria-live="polite">{{ statusFor(`text.${name}`) }}</span>
      <span v-if="foundationError(`text.${name}.${activeMode}`)" :data-foundation-error="`text.${name}.${activeMode}`" role="alert">{{ foundationError(`text.${name}.${activeMode}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset text ${name} ${activeMode}`"
        @click="emit('reset', `text.${name}.${activeMode}`)"
      >
        Reset
      </button>
    </div>
  </fieldset>
</template>
