<script setup lang="ts">
import type { VisualSection } from '@/models/visual-prototype.model'
const props = defineProps<{ section: VisualSection; horizontal?: boolean }>()
const emit = defineEmits<{ select: [section: VisualSection] }>()
const sections: VisualSection[] = ['Foundations', 'Components', 'Branding', 'Icons', 'Inspector']
</script>

<template><nav class="vp-navigation" :class="{ 'vp-navigation--horizontal': horizontal }" aria-label="Builder sections">
  <button v-for="(item, i) in sections" :key="item" :aria-current="props.section === item ? 'page' : undefined" @click="emit('select', item)"><span>{{ ['◈','▦','◉','✳','⌕'][i] }}</span>{{ item }}</button>
</nav></template>
