<script setup lang="ts">
import { computed } from 'vue'
import RawVisualProperties from './RawVisualProperties.vue'
import InspectorTargetControls from '@/components/InspectorTargetControls.vue'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'
import type { ThemeMode } from '@/models/foundations.model'
import type { ThemeScope } from '@/models/theme.model'
import type {
  RawPropertyChange,
  RawPropertyReset,
  RawSelectorChange,
} from './advanced-raw-inspector.dto'
import type { AdvancedRawInspectorProps } from './advanced-raw-inspector.model'
import type { InspectorVisualState } from '@/utils/raw-inspector-state'
import { selectorForInspectorState } from '@/utils/raw-inspector-state'
import { BORDER_TARGET_CATALOG, borderTargetMetadata } from '@/registry/border-target-catalog'
import BorderEdgeControls from '@/components/BorderEdgeControls.vue'
import RawBorderEdgeControls from '@/components/RawBorderEdgeControls.vue'
import type { RawPropertyBatchChange } from './advanced-raw-inspector.dto'

const props = defineProps<AdvancedRawInspectorProps & { activeMode?: ThemeMode; evidence?: InspectorTargetEvidence | null }>()

const emit = defineEmits<{
  'set-selector': [change: RawSelectorChange]
  'set-property': [change: RawPropertyChange]
  'reset-property': [change: RawPropertyReset]
  'reset-override': []
  'set-properties': [change: RawPropertyBatchChange]
  'reset-properties': [properties: ReadonlyArray<import('@/models/raw-overrides.model').RawVisualProperty>]
  'set-state': [state: InspectorVisualState]
  'choose-target': [selector: string]
}>()
const stateOptions = computed((): InspectorVisualState[] => (['default', 'hover', 'focus', 'selected'] as const).filter((state) => selectorForInspectorState(props.selector, state) !== null))
const semanticBorderContext = computed(() => {
  const candidates = [props.evidence?.targetSelector, props.selector, ...(props.evidence?.candidateSelectors ?? [])].filter((candidate): candidate is string => Boolean(candidate))
  const targetId = props.evidence?.targetId ?? (candidates.includes('.fi-section-content-ctn') ? 'surface.section' : BORDER_TARGET_CATALOG.find((target) => target.selectors.some((selector) => candidates.includes(selector)))?.targetId)
  if (!targetId || !borderTargetMetadata(targetId)) return null
  const scope: ThemeScope = props.evidence?.stateId ? 'state' : props.evidence?.variantId ? 'variant' : props.evidence?.componentId ? 'component' : 'global'
  return { targetId, scope, componentId: props.evidence?.componentId, variantId: props.evidence?.variantId, stateId: props.evidence?.stateId }
})
function chooseState(state: InspectorVisualState): void {
  const selector = selectorForInspectorState(props.selector, state)
  if (selector) emit('set-state', state)
}
function resetProperties(properties: ReadonlyArray<import('@/models/raw-overrides.model').RawVisualProperty>): void {
  emit('reset-properties', properties)
}
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
    <InspectorTargetControls :evidence="evidence" :selector="selector" @choose="emit('choose-target', $event)" />
    <BorderEdgeControls
      v-if="semanticBorderContext"
      :target-id="semanticBorderContext.targetId"
      :active-mode="props.activeMode ?? 'light'"
      :scope="semanticBorderContext.scope"
      :component-id="semanticBorderContext.componentId"
      :variant-id="semanticBorderContext.variantId"
      :state-id="semanticBorderContext.stateId"
      label="Semantic Inspector border"
    />
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
    <RawVisualProperties v-bind="props" @set-property="emit('set-property', $event)" @reset-property="emit('reset-property', $event)" @reset-override="emit('reset-override')" />
    <RawBorderEdgeControls v-if="selector" :selector="selector" :active-mode="props.activeMode" :property-value="propertyValue" @set-properties="emit('set-properties', $event)" @reset-properties="resetProperties" />
  </section>
</template>
