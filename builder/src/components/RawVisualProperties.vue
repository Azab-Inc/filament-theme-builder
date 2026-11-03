<script setup lang="ts">
import ColorField from './ColorField.vue'
import ModeValueLink from './ModeValueLink.vue'
import { useColorFieldResets } from '@/composables/use-color-field-resets'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type { ThemeMode } from '@/models/foundations.model'
import type { RawPropertyChange, RawPropertyReset } from './advanced-raw-inspector.dto'
import type { AdvancedRawInspectorProps } from './advanced-raw-inspector.model'
const props = defineProps<AdvancedRawInspectorProps & { activeMode?: ThemeMode }>()
const emit = defineEmits<{ 'set-property': [change: RawPropertyChange]; 'reset-property': [change: RawPropertyReset]; 'reset-override': [] }>()
const { resetKeys, resetField } = useColorFieldResets()
const colors = new Set<RawVisualProperty>(['color', 'background-color', 'border-color'])
function reset(property: RawVisualProperty): void { resetField(property); emit('reset-property', { property }) }
function resetAll(): void { props.properties.forEach(resetField); emit('reset-override') }
</script>

<template>
  <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
    <legend>Visual properties</legend>
    <p v-if="!selector" role="status" class="text-sm">This picked element has no editable selector. Choose a parent surface in Edit target before applying colors.</p>
    <p class="text-sm">Locks keep a value identical between themes. Resetting a linked raw value resets both themes and removes its lock.</p>
    <div v-for="property in properties" :key="property" class="raw-property-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto]">
      <ColorField v-if="colors.has(property)" :mode-target="{ kind: 'raw', selector, property }" :id="`raw-${property}`" :label="`Raw ${property}`" :visible-label="property" :text-label="`Raw ${property}`" :value="propertyValue(property)" :effective-value="propertyValue(property)" profile="raw" :context-key="`${activeThemeId ?? ''}:${props.activeMode ?? 'light'}:${selector}:${property}`" :property="property" :reset-key="resetKeys[property]" @input="emit('set-property', { property, event: $event })" />
      <template v-else><label :for="`raw-${property}`">{{ property }}</label><span class="flex gap-1"><input :id="`raw-${property}`" :name="`raw-${property}`" autocomplete="off" :aria-label="`Raw ${property}`" :value="propertyValue(property)" @input="emit('set-property', { property, event: $event })" /><ModeValueLink :target="{ kind: 'raw', selector, property }" /></span></template>
      <button type="button" :aria-label="`Reset raw ${property}`" @click="reset(property)">Reset</button>
    </div>
    <button type="button" aria-label="Reset raw element override" @click="resetAll">Reset raw override</button>
  </fieldset>
</template>
