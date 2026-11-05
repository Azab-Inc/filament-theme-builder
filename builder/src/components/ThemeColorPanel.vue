<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ColorReferenceOption } from '@/models/color-reference-option.model'
const props = defineProps<{ id: string; options: readonly ColorReferenceOption[]; selectedValue: string }>()
const emit = defineEmits<{ select: [value: string] }>()
const search = ref('')
const groups = computed(() => {
  const query = search.value.trim().toLowerCase()
  const options = props.options.filter((option) => !query || option.label.toLowerCase().includes(query))
  return [...new Set(options.map((option) => option.group ?? 'Colors'))].map((label) => ({ label, options: options.filter((option) => (option.group ?? 'Colors') === label) }))
})
</script>

<template>
  <div class="color-popover__palette">
    <label class="color-popover__search-label" :for="`${id}-theme-search`">Search theme colors</label>
    <input :id="`${id}-theme-search`" v-model="search" type="search" name="theme-color-search" autocomplete="off" spellcheck="false" aria-label="Search theme colors" />
    <div class="color-popover__families">
      <p v-if="!groups.length" class="color-popover__empty" role="status">No matching theme colors.</p>
      <section v-for="(group, index) in groups" :key="group.label" class="color-popover__family" :aria-labelledby="`${id}-theme-group-${index}`">
        <h3 :id="`${id}-theme-group-${index}`">{{ group.label }}</h3>
        <div class="color-popover__swatches">
          <button v-for="option in group.options" :key="option.value" type="button" :aria-label="option.label" :aria-pressed="selectedValue === option.value" :title="option.color ? `${option.label}: ${option.color}` : option.label" @click="emit('select', option.value)">
            <span aria-hidden="true" data-theme-color-swatch :style="{ backgroundColor: option.color ?? 'transparent' }"></span>
            <small>{{ option.label }}</small>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
