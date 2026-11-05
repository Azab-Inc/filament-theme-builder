<script setup lang="ts">
import { ref } from 'vue'
import { useDashboardPrototypeStore } from '@/stores/dashboard-prototype'
import { usePreviewTheme } from '@/composables/use-preview-theme'
import DashboardPrototypeControls from '@/components/DashboardPrototypeControls.vue'
import DashboardPrototypeToolbar from '@/components/DashboardPrototypeToolbar.vue'
import '@/styles/dashboard-prototype.css'

const draft = useDashboardPrototypeStore()
const iframe = ref<HTMLIFrameElement>()
const activeMode = ref<'light' | 'dark'>('light')
const exportOpen = ref(false)
const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
const preview = usePreviewTheme({ theme: draft, activeMode, previewUrl, iframe })
const iframeSrc = preview.iframeSrc
function exportDraft() { const blob = new Blob([JSON.stringify(draft.theme, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'filament-theme-draft.json'; link.click(); URL.revokeObjectURL(url) }
</script>

<template>
  <main class="db-root">
    <DashboardPrototypeToolbar @export="exportOpen = !exportOpen" />
    <div v-if="exportOpen" class="db-export"><b>Draft export</b><span>Browser-only JSON; no production storage.</span><button @click="exportDraft">Download draft JSON</button><button @click="exportOpen = false">Close</button></div>
    <div class="db-layout"><DashboardPrototypeControls :draft="draft" /><section class="db-preview-region" aria-label="Live Filament dashboard preview"><iframe ref="iframe" :src="iframeSrc" title="Filament preview" data-dashboard-preview @load="preview.onPreviewLoad" /></section></div>
  </main>
</template>
