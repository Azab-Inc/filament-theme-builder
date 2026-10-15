<script setup lang="ts">
import type {
  RawPropertyChange,
  RawPropertyReset,
  RawSelectorChange,
} from './advanced-raw-inspector.dto'
import type { AdvancedRawInspectorProps } from './advanced-raw-inspector.model'

defineProps<AdvancedRawInspectorProps>()

const emit = defineEmits<{
  'set-selector': [change: RawSelectorChange]
  'set-property': [change: RawPropertyChange]
  'reset-property': [change: RawPropertyReset]
  'reset-override': []
}>()
</script>

<template>
  <section
    v-if="visible"
    id="editor-panel-inspector"
    class="advanced-inspector grid gap-4"
    role="tabpanel"
    tabindex="0"
    aria-labelledby="editor-tab-inspector"
    data-advanced-inspector
    data-editor-section="inspector"
  >
    <h2 id="advanced-inspector-heading">Advanced Inspector</h2>
    <p>
      Raw visual overrides are validated typed properties and remain separate from Semantic
      controls.
    </p>
    <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
      <legend>Raw element target</legend>
      <label for="raw-selector">Selector</label>
      <input
        id="raw-selector"
        aria-label="Raw element selector"
        :value="selector"
        :aria-invalid="selectorError ? 'true' : undefined"
        @input="emit('set-selector', { event: $event })"
      />
      <p v-if="selectorClassification.quality === 'fragile'" role="alert" data-selector-warning>
        {{ selectorClassification.warning }}
      </p>
      <p v-if="selectorError" role="alert">{{ selectorError }}</p>
      <p v-else-if="selectorClassification.quality === 'stable'" role="status">
        Stable Filament selector proposed.
      </p>
      <p v-else-if="selectorClassification.quality === 'unavailable'" role="alert">
        No safe selector was detected.
      </p>
    </fieldset>
    <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
      <legend>Visual properties</legend>
      <div
        v-for="property in properties"
        :key="property"
        class="raw-property-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto]"
      >
        <label :for="`raw-${property}`">{{ property }}</label>
        <input
          :id="`raw-${property}`"
          :aria-label="`Raw ${property}`"
          :value="propertyValue(property)"
          @input="emit('set-property', { property, event: $event })"
        />
        <button
          type="button"
          :aria-label="`Reset raw ${property}`"
          @click="emit('reset-property', { property })"
        >
          Reset
        </button>
      </div>
      <button type="button" aria-label="Reset raw element override" @click="emit('reset-override')">
        Reset raw override
      </button>
    </fieldset>
  </section>
</template>
