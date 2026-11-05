<script setup lang="ts">
import type { VisualSection } from '@/models/visual-prototype.model'
defineProps<{ section: VisualSection }>()
</script>

<template><div v-if="section !== 'Foundations'" class="vp-section-content"><div class="vp-section-heading"><small>BUILDER / {{ section.toUpperCase() }}</small><h2>{{ section }}</h2><p>Preview controls shown here are local design-study interactions only.</p></div>
  <details open><summary>{{ section === 'Components' ? 'Button defaults' : section === 'Branding' ? 'Panel identity' : section === 'Icons' ? 'Icon pack' : 'Selection details' }}</summary>
    <label v-if="section === 'Components'">Control size<select><option>Default</option><option>Compact</option><option>Spacious</option></select></label>
    <label v-if="section === 'Branding'">Panel name<input value="Admin panel"></label>
    <label v-if="section === 'Icons'">Icon set<select><option>Heroicons</option><option>Tabler</option></select></label>
    <label v-if="section === 'Inspector'">Selected area<input value="Dashboard overview" readonly></label>
    <label>Corner radius<select><option>Medium</option><option>Small</option><option>Large</option></select></label>
  </details><p class="vp-disclosure">No settings are saved or sent to the reference preview.</p></div></template>
