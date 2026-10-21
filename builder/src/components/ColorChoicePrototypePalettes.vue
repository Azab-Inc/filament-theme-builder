<script setup lang="ts">
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeState,
} from '@/models/color-choice-prototype.model'
import ColorChoicePrototypePaletteItem from '@/components/ColorChoicePrototypePaletteItem.vue'
const props = defineProps<{ state: ColorChoicePrototypeState; host: ColorChoicePrototypeHost }>()
</script>

<template>
  <section class="ccp-panel">
    <header>
      <span>01 · COLOR SYSTEM</span>
      <h2>Semantic palettes</h2>
      <small>Six established palettes · base and 11 editable shade values</small>
    </header>
    <ColorChoicePrototypePaletteItem
      v-for="name in state.palettes"
      :key="name"
      :state="state"
      :name="name"
      :host="host"
    />
  </section>
</template>
