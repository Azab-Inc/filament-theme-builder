<script setup lang="ts">
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeState,
  ColorChoicePrototypeTarget,
  ColorChoicePrototypeScope,
} from '@/models/color-choice-prototype.model'
import ColorChoicePrototypeBoundField from '@/components/ColorChoicePrototypeBoundField.vue'
const props = defineProps<{ state: ColorChoicePrototypeState; host: ColorChoicePrototypeHost }>()
const scopes: ColorChoicePrototypeScope[] = ['global', 'component', 'variant', 'state']
function selectScope(scope: ColorChoicePrototypeScope) {
  props.state.close()
  props.state.scope.value = scope
}
function target(): ColorChoicePrototypeTarget {
  const scope = props.state.scope.value
  return props.state.target(
    `component:${scope}`,
    `Product name background · ${scope}`,
    props.state.componentBackgrounds[scope],
    '#ffffff',
    'component',
    scope,
  )
}
</script>

<template>
  <div class="ccp-heading">
    <div>
      <small>COMPONENTS / PRODUCT NAME</small>
      <h1>Existing color control</h1>
      <p>Same Product name background field, shown at existing scopes only.</p>
    </div>
  </div>
  <section class="ccp-panel">
    <header>
      <span>01 · COMPONENT COLOR</span>
      <h2>Product name background</h2>
      <small>{{ state.scope.value }} scope</small>
    </header>
    <div class="ccp-scopes">
      <button
        v-for="scope in scopes"
        :key="scope"
        :aria-pressed="state.scope.value === scope"
        @click="selectScope(scope)"
      >
        {{ scope }}
      </button>
    </div>
    <ColorChoicePrototypeBoundField :state="state" :target="target()" :host="host" />
  </section>
</template>
