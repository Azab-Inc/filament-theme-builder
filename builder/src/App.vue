<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import { storeToRefs } from 'pinia'

import { useThemeStore } from '@/stores/theme'

const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
const theme = useThemeStore()
const iframe = ref<HTMLIFrameElement>()
const { canUndo, canRedo } = storeToRefs(theme)
const primaryColor = computed({
  get: () => theme.theme.colors.primary,
  set: (color: string) => theme.setPrimaryColor(color),
})

function postTheme(): void {
  const target = iframe.value?.contentWindow
  if (!target) return
  const targetOrigin = new URL(previewUrl, window.location.href).origin
  target.postMessage({
    type: 'ftb:theme:update',
    schemaVersion: 1,
    theme: structuredClone(toRaw(theme.theme)),
  }, targetOrigin)
}

function handleKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
  const target = event.target
  if (target instanceof HTMLInputElement && target.type !== 'color') return
  event.preventDefault()
  if (event.shiftKey) theme.redo()
  else theme.undo()
}

watch(() => theme.theme, () => {
  postTheme()
}, { deep: true })

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  postTheme()
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

function undo(): void {
  theme.undo()
}

function redo(): void {
  theme.redo()
}
</script>

<template>
  <main class="preview-shell">
    <header class="preview-shell__header">
      <h1>Filament Theme Builder</h1>
      <p data-demo-notice>Preview demo data is temporary.</p>
      <label>Primary color
        <input v-model="primaryColor" type="color" aria-label="Primary color" />
      </label>
      <button type="button" aria-label="Undo" :disabled="!canUndo" @click="undo">Undo</button>
      <button type="button" aria-label="Redo" :disabled="!canRedo" @click="redo">Redo</button>
    </header>
    <iframe ref="iframe" :src="previewUrl" title="Filament preview" class="preview-shell__frame" @load="postTheme" />
  </main>
</template>

<style scoped>
.preview-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.preview-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
}

.preview-shell__header h1 {
  margin: 0;
  font-size: 1rem;
}

.preview-shell__header p {
  margin: 0;
  color: #71717a;
  font-size: 0.75rem;
}

.preview-shell__frame {
  width: 100%;
  flex: 1;
  border: 0;
}
</style>
