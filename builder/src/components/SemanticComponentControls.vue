<script setup lang="ts">
import type {
  SemanticComponentReset,
  SemanticComponentValueChange,
} from './semantic-component-controls.dto'
import type {
  SemanticComponentControlsProps,
  SemanticComponentRow,
} from './semantic-component-controls.model'
import ColorField from '@/components/ColorField.vue'
import { useColorFieldResets } from '@/composables/use-color-field-resets'
import PaddingHierarchyPanel from './PaddingHierarchyPanel.vue'
import type { PaddingMutation, PaddingReadResult, PaddingContext } from '@/models/padding.model'
import type { RegistryPaddingTarget } from '@/models/padding-registry.model'

defineProps<SemanticComponentControlsProps & { paddingTargets?: readonly RegistryPaddingTarget[]; paddingRead?: (request: { targetId: string; selectedContext: PaddingContext }) => PaddingReadResult; paddingSet?: (mutation: PaddingMutation & { operation: 'set' }) => void; paddingReset?: (mutation: PaddingMutation & { operation: 'reset' }) => void }>()

const emit = defineEmits<{
  'set-value': [change: SemanticComponentValueChange]
  reset: [change: SemanticComponentReset]
}>()
const { resetKeys, resetField } = useColorFieldResets()

function setValue(row: SemanticComponentRow, event: Event): void {
  emit('set-value', { row, event })
}

function resetValue(row: SemanticComponentRow): void {
  resetField(row.scope)
  emit('reset', { row })
}
</script>

<template>
  <section
    id="editor-panel-components"
    class="component-controls grid gap-4"
    role="tabpanel"
    tabindex="0"
    aria-labelledby="editor-tab-components"
    data-editor-target="form.product-name"
    data-editor-section="components"
  >
    <h2 id="component-controls-heading">Component controls</h2>
    <p>Product name input · <code>.fi-fo-text-input .fi-input</code> · background color</p>
    <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
      <legend>Global → Component → Variant → State</legend>
      <div
        v-for="row in rows"
        :key="row.scope"
        class="component-control-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]"
      >
        <ColorField :id="`product-name-${row.scope}-background`" :label="`Product name ${row.label} background`" :visible-label="`Product name ${row.label} background`" :text-label="`Product name ${row.scope} background`" :value="row.value" :effective-value="row.value" profile="hex6" :context-key="`${activeThemeId ?? ''}:${row.scope}:${row.request.targetId}`" :status-id="`product-name-${row.scope}-status`" :reset-key="resetKeys[row.scope]" @input="setValue(row, $event)" />
        <span :id="`product-name-${row.scope}-status`" role="status" :data-theme-source="row.source">{{
          row.explicit ? `Explicit (${row.source})` : `Inherited from ${row.source}`
        }}</span>
        <button
          type="button"
          :aria-label="`Reset Product name ${row.scope} background`"
          @click="resetValue(row)"
        >
          Reset to inherit
        </button>
      </div>
    </fieldset>
    <PaddingHierarchyPanel v-if="paddingTargets && paddingRead && paddingSet && paddingReset" :targets="paddingTargets" :read="paddingRead" :set="paddingSet" :reset="paddingReset" />
  </section>
</template>
