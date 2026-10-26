<script setup lang="ts">
import { useColorFieldResets } from '@/composables/use-color-field-resets'
import ColorField from '@/components/ColorField.vue'
import type { FoundationsSurfaceControlsEmits } from '@/dtos/foundations-surface-controls-emits.dto'
import type { FoundationsSurfaceControlsProps } from '@/dtos/foundations-surface-controls-props.dto'

defineProps<FoundationsSurfaceControlsProps>()
const emit = defineEmits<FoundationsSurfaceControlsEmits>()
const { resetKeys, resetField } = useColorFieldResets()
function reset(path: string): void { resetField(path); emit('reset', path) }
</script>

<template>
  <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
    <legend>Surfaces, borders, text, and modes</legend>
    <div v-for="name in surfaceNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <ColorField :id="`${name}-surface`" :label="`${name} surface ${activeMode}`" :value="surfaces[name]" :effective-value="surfaces[name]" profile="foundation" :context-key="`${contextKey ?? ''}:${activeMode}`" :status-id="`surface-${name}-status`" :error-id="`surface-${name}-error`" :error="foundationError(`surfaces.${name}.${activeMode}`)" external-error :reset-key="resetKeys[`surfaces.${name}.${activeMode}`]" @input="emit('set-mode-value', { path: `surfaces.${name}`, event: $event })" />
      <span :id="`surface-${name}-status`" role="status" aria-live="polite">{{ statusFor(`surfaces.${name}`) }}</span>
      <span v-if="foundationError(`surfaces.${name}.${activeMode}`)" :id="`surface-${name}-error`" :data-foundation-error="`surfaces.${name}.${activeMode}`" role="alert">{{ foundationError(`surfaces.${name}.${activeMode}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset ${name} surface`"
        @click="reset(`surfaces.${name}.${activeMode}`)"
      >
        Reset
      </button>
    </div>
    <div v-for="name in borderNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <ColorField :id="`border-${name}-${activeMode}`" :label="`border ${name} ${activeMode}`" :visible-label="`border ${name} ${activeMode}`" :text-label="`Border ${name} ${activeMode}`" :value="borders[name]" :effective-value="borders[name]" profile="foundation" :context-key="`${contextKey ?? ''}:${activeMode}`" :status-id="`border-${name}-status`" :error-id="`border-${name}-error`" :error="foundationError(`borders.${name}.${activeMode}`)" external-error :reset-key="resetKeys[`borders.${name}.${activeMode}`]" @input="emit('set-mode-value', { path: `borders.${name}`, event: $event })" />
      <span :id="`border-${name}-status`" role="status" aria-live="polite">{{ statusFor(`borders.${name}`) }}</span>
      <span v-if="foundationError(`borders.${name}.${activeMode}`)" :id="`border-${name}-error`" :data-foundation-error="`borders.${name}.${activeMode}`" role="alert">{{ foundationError(`borders.${name}.${activeMode}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset border ${name} ${activeMode}`"
        @click="reset(`borders.${name}.${activeMode}`)"
      >
        Reset
      </button>
    </div>
    <div v-for="name in textNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
      <ColorField :id="`text-${name}-${activeMode}`" :label="`text ${name} ${activeMode}`" :visible-label="`text ${name} ${activeMode}`" :text-label="`Text ${name} ${activeMode}`" :value="text[name]" :effective-value="text[name]" profile="foundation" :context-key="`${contextKey ?? ''}:${activeMode}`" :status-id="`text-${name}-status`" :error-id="`text-${name}-error`" :error="foundationError(`text.${name}.${activeMode}`)" external-error :reset-key="resetKeys[`text.${name}.${activeMode}`]" @input="emit('set-mode-value', { path: `text.${name}`, event: $event })" />
      <span :id="`text-${name}-status`" role="status" aria-live="polite">{{ statusFor(`text.${name}`) }}</span>
      <span v-if="foundationError(`text.${name}.${activeMode}`)" :id="`text-${name}-error`" :data-foundation-error="`text.${name}.${activeMode}`" role="alert">{{ foundationError(`text.${name}.${activeMode}`) }}</span>
      <button
        type="button"
        :aria-label="`Reset text ${name} ${activeMode}`"
        @click="reset(`text.${name}.${activeMode}`)"
      >
        Reset
      </button>
    </div>
  </fieldset>
</template>
