<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { guidelineGroups, isGuidelineGroup, type GuidelineGroup } from '@/models/guidelines-prototype.model'

const params = () => new URLSearchParams(location.search)
const query = ref(params().get('q') ?? '')
const requestedGroup = params().get('group')
const group = ref<GuidelineGroup>(isGuidelineGroup(requestedGroup) ? requestedGroup : 'Typography')
const samples = reactive<Record<string, string>>({ 'Page surface': '#f9fafb', 'Body font': 'Inter', 'Heading scale': '1.5rem', 'Content width': '72rem', 'Accent color': '#236c63' })
let querySessionStarted = false
const items = [{ name: 'Page surface', group: 'Surfaces' }, { name: 'Body font', group: 'Typography' }, { name: 'Heading scale', group: 'Typography' }, { name: 'Content width', group: 'Layout' }, { name: 'Accent color', group: 'Colors' }] as const
const results = computed(() => items.filter(item => item.group === group.value && item.name.toLowerCase().includes(query.value.toLowerCase())))
function syncUrl(mode: 'push' | 'replace' = 'replace') { const url = new URL(location.href); query.value ? url.searchParams.set('q', query.value) : url.searchParams.delete('q'); url.searchParams.set('group', group.value); history[`${mode}State`]({}, '', url) }
function setQuery(value: string) { query.value = value; syncUrl() }
function beginQuerySession() {
  if (querySessionStarted) return
  querySessionStarted = true
  const url = new URL(location.href)
  history.pushState({}, '', url)
}
function endQuerySession() { querySessionStarted = false }
function setGroup(value: GuidelineGroup) { group.value = value; syncUrl('push') }
function updateFromUrl() { const next = params().get('group'); group.value = isGuidelineGroup(next) ? next : 'Typography'; query.value = params().get('q') ?? '' }
onMounted(() => addEventListener('popstate', updateFromUrl)); onUnmounted(() => removeEventListener('popstate', updateFromUrl))
</script>

<template>
  <section class="gp-shell"><header><b>Theme builder / Foundations</b><span>Find settings without scanning every section</span></header>
    <div class="gp-body"><aside><h1>Findable settings</h1><label>Find settings<input :value="query" type="search" placeholder="Search settings" @focus="beginQuerySession" @blur="endQuerySession" @input="setQuery(($event.target as HTMLInputElement).value)" /><button v-if="query" aria-label="Clear search" @click="setQuery('')">Clear</button></label><nav aria-label="Foundation groups"><button v-for="item in guidelineGroups" :key="item" :aria-current="group === item ? 'page' : undefined" @click="setGroup(item)">{{ item }}</button></nav></aside>
      <article><h2>{{ group }}</h2><p>Search the selected group, then edit a real sample value without losing it when you move between groups.</p><div v-if="results.length" class="gp-results"><label v-for="item in results" :key="item.name">{{ item.name }}<input :aria-label="item.name" v-model="samples[item.name]" /><small>Sample preview: {{ samples[item.name] }}</small></label></div><p v-else role="status">No matching settings</p></article></div>
  </section>
</template>
