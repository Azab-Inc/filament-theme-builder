<script setup lang="ts">
import type {
  SemanticComponentReset,
  SemanticComponentValueChange,
} from './semantic-component-controls.dto'
import type {
  SemanticComponentControlsProps,
  SemanticComponentRow,
} from './semantic-component-controls.model'

defineProps<SemanticComponentControlsProps>()

const emit = defineEmits<{
  'set-value': [change: SemanticComponentValueChange]
  reset: [change: SemanticComponentReset]
}>()

function setValue(row: SemanticComponentRow, event: Event): void {
  emit('set-value', { row, event })
}

function resetValue(row: SemanticComponentRow): void {
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
        <label :for="`product-name-${row.scope}-background`"
          >Product name {{ row.label }} background</label
        >
        <input
          :id="`product-name-${row.scope}-background`"
          type="text"
          :aria-label="`Product name ${row.scope} background`"
          :value="row.value"
          @input="setValue(row, $event)"
        />
        <span role="status" :data-theme-source="row.source">{{
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
  </section>
</template>
