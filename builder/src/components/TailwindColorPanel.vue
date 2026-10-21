<script setup lang="ts">
import { computed, shallowRef } from 'vue'
import { getTailwindColors, searchTailwindColors } from '@/utils/tailwind-palette'
import type { TailwindColor } from '@/models/tailwind-palette.model'

const emit = defineEmits<{ select: [color: TailwindColor] }>()
const props = defineProps<{ id: string; selectedValue: string }>()
const search = shallowRef('')
const colors = computed(() => searchTailwindColors(search.value))
const families = computed(() => [...new Set((search.value ? colors.value : getTailwindColors()).map((color) => color.family))])
</script>

<template>
  <div :id="`${id}-tailwind-panel`" class="color-popover__palette" role="tabpanel" :aria-labelledby="`${id}-tailwind-tab`">
    <label class="color-popover__search-label" :for="`${id}-tailwind-search`">Search Tailwind colors</label>
    <input :id="`${id}-tailwind-search`" v-model="search" type="search" aria-label="Search Tailwind colors" />
    <p class="color-popover__result-count" role="status" aria-live="polite">{{ colors.length }} colors</p>
    <p v-if="!colors.length" class="color-popover__empty">No colors found. Clear search to see all colors.</p>
    <div class="color-popover__families">
      <section v-for="family in families" :key="family" class="color-popover__family" :aria-label="family">
        <h3>{{ family }}</h3>
        <div class="color-popover__swatches">
          <button v-for="color in colors.filter((item) => item.family === family)" :key="color.name" type="button"
            :aria-label="`${color.family} ${color.shade} ${color.value}`" :aria-pressed="color.value.toLowerCase() === props.selectedValue.toLowerCase()" :title="color.name" @click="emit('select', color)">
            <span :style="{ backgroundColor: color.value }" aria-hidden="true"></span>
            <small aria-hidden="true">{{ color.shade }}</small>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
