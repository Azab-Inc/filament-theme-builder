<script setup lang="ts">
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeState,
} from '@/models/color-choice-prototype.model'
import ColorChoicePrototypeFoundations from '@/components/ColorChoicePrototypeFoundations.vue'
import ColorChoicePrototypeComponents from '@/components/ColorChoicePrototypeComponents.vue'
const props = defineProps<{ state: ColorChoicePrototypeState; host: ColorChoicePrototypeHost }>()
</script>

<template>
  <main class="ccp-editor">
    <ColorChoicePrototypeFoundations
      v-if="state.section.value === 'Foundations'"
      :state="state"
      :host="host"
    /><ColorChoicePrototypeComponents v-else :state="state" :host="host" />
  </main>
</template>
