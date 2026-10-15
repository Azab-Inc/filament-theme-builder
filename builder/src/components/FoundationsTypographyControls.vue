<script setup lang="ts">
import type { FoundationTypographyName } from '@/models/foundation-typography-name.model'
import type { FoundationsTypographyLayoutControlsEmits } from '@/dtos/foundations-typography-layout-controls-emits.dto'
import type { FoundationsTypographyLayoutControlsProps } from '@/dtos/foundations-typography-layout-controls-props.dto'

const props = defineProps<FoundationsTypographyLayoutControlsProps>()
const emit = defineEmits<FoundationsTypographyLayoutControlsEmits>()
const typographyNames: readonly FoundationTypographyName[] = ['body', 'heading', 'mono']

function fontSelection(name: FoundationTypographyName): string {
  const selected = props.typography[name]
  if (selected.kind === 'custom') return 'custom'
  if (selected.kind === 'curated') return `curated:${selected.name}`
  return selected.name === 'System Mono' ? 'system-mono' : 'system'
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
      <button type="button" :aria-label="`Reset ${name} font`" @click="emit('reset', `typography.${name}`)">
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
</template>
