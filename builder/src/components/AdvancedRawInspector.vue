<script setup lang="ts">
import { computed } from 'vue'
import { useColorFieldResets } from '@/composables/use-color-field-resets'
import ColorField from '@/components/ColorField.vue'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import type {
  RawPropertyChange,
  RawPropertyReset,
  RawSelectorChange,
} from './advanced-raw-inspector.dto'
import type { AdvancedRawInspectorProps } from './advanced-raw-inspector.model'
import type { InspectorVisualState } from '@/utils/raw-inspector-state'
import { selectorForInspectorState } from '@/utils/raw-inspector-state'

const props = defineProps<AdvancedRawInspectorProps>()

const emit = defineEmits<{
  'set-selector': [change: RawSelectorChange]
  'set-property': [change: RawPropertyChange]
  'reset-property': [change: RawPropertyReset]
  'reset-override': []
  'set-state': [state: InspectorVisualState]
}>()
const { resetKeys, resetField } = useColorFieldResets()
const colorProperties = new Set<RawVisualProperty>(['color', 'background-color', 'border-color'])
const stateOptions = computed((): InspectorVisualState[] => (['default', 'hover', 'focus', 'selected'] as const).filter((state) => selectorForInspectorState(props.selector, state) !== null))
function chooseState(state: InspectorVisualState): void {
  const selector = selectorForInspectorState(props.selector, state)
  if (selector) emit('set-state', state)
}
function resetProperty(property: RawVisualProperty): void { resetField(property); emit('reset-property', { property }) }
function resetOverride(): void { props.properties.forEach(resetField); emit('reset-override') }
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
        name="raw-selector"
        autocomplete="off"
        spellcheck="false"
        aria-label="Raw element selector"
        :value="selector"
        :aria-invalid="selectorError ? 'true' : undefined"
        :aria-describedby="selectorError ? 'raw-selector-error' : undefined"
        @input="emit('set-selector', { event: $event })"
      />
      <p v-if="selectorClassification.quality === 'fragile'" role="alert" data-selector-warning>
        {{ selectorClassification.warning }}
      </p>
      <p v-if="selectorError" id="raw-selector-error" role="alert">{{ selectorError }}</p>
      <p v-else-if="selectorClassification.quality === 'stable'" role="status">
        Stable Filament selector proposed.
      </p>
      <p v-else-if="selectorClassification.quality === 'unavailable'" role="alert">
        No safe selector was detected.
      </p>
    </fieldset>
    <fieldset class="grid grid-cols-2 gap-2 rounded-lg border border-zinc-200 p-4" aria-label="Inspector state">
      <legend>Visual state</legend>
      <button v-for="state in stateOptions" :key="state" type="button" :aria-pressed="(props.state ?? 'default') === state" @click="chooseState(state)">
        {{ state[0]?.toUpperCase() }}{{ state.slice(1) }}
      </button>
    </fieldset>
    <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
      <legend>Visual properties</legend>
      <div
        v-for="property in properties"
        :key="property"
        class="raw-property-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto]"
      >
        <ColorField v-if="colorProperties.has(property)" :id="`raw-${property}`" :label="`Raw ${property}`" :visible-label="property" :text-label="`Raw ${property}`" :value="propertyValue(property)" :effective-value="propertyValue(property)" profile="raw" :context-key="`${activeThemeId ?? ''}:${selector}:${property}`" :property="property" :reset-key="resetKeys[property]" @input="emit('set-property', { property, event: $event })" />
        <template v-else><label :for="`raw-${property}`">{{ property }}</label><input :id="`raw-${property}`" :name="`raw-${property}`" autocomplete="off" :aria-label="`Raw ${property}`" :value="propertyValue(property)" @input="emit('set-property', { property, event: $event })" /></template>
        <button
          type="button"
          :aria-label="`Reset raw ${property}`"
          @click="resetProperty(property)"
        >
          Reset
        </button>
      </div>
      <button type="button" aria-label="Reset raw element override" @click="resetOverride">
        Reset raw override
      </button>
    </fieldset>
  </section>
</template>
