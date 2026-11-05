<script setup lang="ts">
import type { FoundationState } from '@/models/foundations.model'
defineProps<{ foundations: FoundationState }>()
const surfaces = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
const textRoles = ['primary', 'muted', 'disabled'] as const
</script>

<template><div class="vp-foundation-groups">
  <details><summary>Surfaces, borders &amp; text</summary><label v-for="name in surfaces" :key="name">{{ name }} surface<input v-model="foundations.surfaces[name].light" :aria-label="`${name} surface color`"></label>
    <label>Default border<input v-model="foundations.borders.default.light" aria-label="Default border color"></label>
    <label v-for="name in textRoles" :key="name">{{ name }} text<input v-model="foundations.text[name].light" :aria-label="`${name} text color`"></label>
  </details>
  <details><summary>Typography</summary><label>Body font<input v-model="foundations.typography.body.name" aria-label="Body font name"></label><label>Heading font<input v-model="foundations.typography.heading.name" aria-label="Heading font name"></label></details>
  <details><summary>Layout foundations</summary><label>Density<select v-model="foundations.density"><option value="compact">Compact</option><option value="default">Default</option><option value="spacious">Spacious</option></select></label>
    <label>Radius<select v-model="foundations.radius"><option>none</option><option>sm</option><option>md</option><option>lg</option><option>xl</option><option>full</option></select></label>
    <label>Border width<input v-model.number="foundations.borderWidth" type="number" min="0" aria-label="Border width"></label><label>Shadow<select v-model="foundations.shadow"><option>none</option><option>sm</option><option>md</option><option>lg</option><option>xl</option></select></label>
  </details>
</div></template>
