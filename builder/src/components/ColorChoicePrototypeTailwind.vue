<script setup lang="ts">
import { computed } from 'vue'
import {
  COLOR_CHOICE_PROTOTYPE_COLORS,
  colorChoicePrototypeHex,
} from '@/utils/color-choice-prototype-colors'
const props = defineProps<{ search: string }>()
const emit = defineEmits<{
  select: [value: string, token: string, originalValue: string]
  'update:search': [value: string]
}>()
const filtered = computed(() =>
  COLOR_CHOICE_PROTOTYPE_COLORS.filter((color) =>
    `${color.family} ${color.shade} ${color.token}`.includes(props.search.toLowerCase().trim()),
  ),
)
const families = computed(() => [...new Set(filtered.value.map((color) => color.family))])
function updateSearch(event: Event) {
  emit('update:search', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="ccp-palette">
    <input
      type="search"
      :value="search"
      aria-label="Search family shade or token"
      placeholder="Search gray, 900, gray-900"
      @input="updateSearch"
    />
    <p class="ccp-count" aria-live="polite">{{ filtered.length }} shades · local Tailwind v4.3.3</p>
    <div class="ccp-ramp-list">
      <div v-for="family in families" :key="family" class="ccp-ramp">
        <b>{{ family }}</b>
        <button
          v-for="color in filtered.filter((entry) => entry.family === family)"
          :key="color.token"
          :title="color.token"
          :aria-label="`${color.token}, ${color.value}`"
          @click="emit('select', colorChoicePrototypeHex(color.value), color.token, color.value)"
        >
          <i :style="{ background: color.value }"></i><small>{{ color.shade }}</small>
        </button>
      </div>
    </div>
    <p v-if="!filtered.length" class="ccp-hint">No shades match. Clear the search to recover.</p>
    <footer>Local Tailwind default theme · source 4.3.3</footer>
  </div>
</template>
