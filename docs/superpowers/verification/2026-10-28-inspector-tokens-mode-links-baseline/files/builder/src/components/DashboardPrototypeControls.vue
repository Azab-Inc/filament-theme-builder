<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { useDashboardPrototypeStore } from '@/stores/dashboard-prototype'
import DashboardPrototypeField from '@/components/DashboardPrototypeField.vue'

const props = defineProps<{ draft: ReturnType<typeof useDashboardPrototypeStore> }>()
const query = ref('')
const group = ref<'All' | 'Colors' | 'Surfaces' | 'Layout'>('All')
const groups = ['All', 'Colors', 'Surfaces', 'Layout'] as const
const errors = reactive<Record<string, string>>({})
const colorDraft = ref('#6366f1')
const surfaceDraft = ref('var(--gray-50)')
const items = computed(() => ({
  All: ['Primary color', 'Page surface', 'Density', 'Radius'],
  Colors: ['Primary color'], Surfaces: ['Page surface'], Layout: ['Density', 'Radius'],
})[group.value].filter(item => item.toLowerCase().includes(query.value.toLowerCase())))
const color = computed(() => props.draft.theme.foundations.palettes.primary.base)
const surface = computed(() => props.draft.theme.foundations.surfaces.page.light)
function setColor(value: string) { colorDraft.value = value; errors.color = /^#[\da-f]{6}$/i.test(value) ? '' : 'Use a six-digit hex color.'; if (!errors.color) props.draft.setPrimaryColor(value) }
function setSurface(value: string) { surfaceDraft.value = value; errors.surface = /^#[\da-f]{6}$/i.test(value) || /^var\(--gray-(50|900)\)$/.test(value) ? '' : 'Use a supported hex or gray token.'; if (!errors.surface) props.draft.setFoundation('surfaces.page.light', value) }
function reset(path: string, key: string) { props.draft.resetFoundation(path); errors[key] = ''; if (key === 'color') colorDraft.value = color.value; if (key === 'surface') surfaceDraft.value = surface.value }
</script>

<template>
  <aside class="db-dock" aria-label="Foundation editing dock">
    <div class="db-dock-head"><b>Foundations</b><span>Prototype · Unsaved draft</span></div>
    <label class="db-search">Find foundation settings<input v-model="query" name="foundation-search" type="search" autocomplete="off" /></label>
    <button v-if="query" class="db-clear" type="button" aria-label="Clear search" @click="query = ''">Clear</button>
    <nav aria-label="Foundation groups"><button v-for="item in groups" :key="item" :aria-current="group === item ? 'page' : undefined" @click="group = item">{{ item }}</button></nav>
    <p v-if="!items.length" class="db-empty" role="status">No matching foundation settings</p>
    <section v-else><h2>{{ group }}</h2>
      <DashboardPrototypeField v-if="items.includes('Primary color')" label="Primary color" name="primary-color" :value="colorDraft" :error="errors.color" @reset="reset('palettes.primary.base', 'color')">
        <template #default="slot"><input :id="slot.id" :name="slot.fieldName" :value="colorDraft" autocomplete="off" spellcheck="false" :aria-invalid="errors.color ? 'true' : 'false'" :aria-describedby="errors.color ? 'primary-color-error' : undefined" @input="setColor(($event.target as HTMLInputElement).value)" /></template>
      </DashboardPrototypeField>
      <DashboardPrototypeField v-if="items.includes('Page surface')" label="Page surface" name="page-surface" :value="surfaceDraft" :error="errors.surface" @reset="reset('surfaces.page.light', 'surface')">
        <template #default="slot"><input :id="slot.id" :name="slot.fieldName" :value="surfaceDraft" autocomplete="off" spellcheck="false" :aria-invalid="errors.surface ? 'true' : 'false'" :aria-describedby="errors.surface ? 'page-surface-error' : undefined" @input="setSurface(($event.target as HTMLInputElement).value)" /></template><template #source>Source: {{ surface.startsWith('var') ? 'Inherited · ' + surface : 'Override · ' + surface }}</template>
      </DashboardPrototypeField>
      <DashboardPrototypeField v-if="items.includes('Density')" label="Density" name="density" :value="props.draft.theme.foundations.density" @reset="reset('density', 'density')"><template #default="slot"><select :id="slot.id" :name="slot.fieldName" :value="props.draft.theme.foundations.density" autocomplete="off" @change="props.draft.setDensity(($event.target as HTMLSelectElement).value as 'compact' | 'default' | 'spacious')"><option>compact</option><option>default</option><option>spacious</option></select></template></DashboardPrototypeField>
      <DashboardPrototypeField v-if="items.includes('Radius')" label="Radius" name="radius" :value="props.draft.theme.foundations.radius" @reset="reset('radius', 'radius')"><template #default="slot"><select :id="slot.id" :name="slot.fieldName" :value="props.draft.theme.foundations.radius" autocomplete="off" @change="props.draft.setFoundation('radius', ($event.target as HTMLSelectElement).value)"><option>none</option><option>sm</option><option>md</option><option>lg</option><option>xl</option></select></template></DashboardPrototypeField>
    </section>
  </aside>
</template>
