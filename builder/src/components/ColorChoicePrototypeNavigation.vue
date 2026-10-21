<script setup lang="ts">
import type {
  ColorChoicePrototypeSection,
  ColorChoicePrototypeState,
} from '@/models/color-choice-prototype.model'
const props = defineProps<{ state: ColorChoicePrototypeState }>()
function select(section: ColorChoicePrototypeSection) {
  props.state.close()
  props.state.section.value = section
}
</script>

<template>
  <nav class="ccp-navigation" aria-label="Studio sections">
    <button
      :aria-current="state.section.value === 'Foundations' ? 'page' : undefined"
      @click="select('Foundations')"
    >
      <span>◈</span> Foundations
    </button>
    <button
      :aria-current="state.section.value === 'Components' ? 'page' : undefined"
      @click="select('Components')"
    >
      <span>▦</span> Components
    </button>
  </nav>
</template>
