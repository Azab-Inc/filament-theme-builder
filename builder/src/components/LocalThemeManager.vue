<script setup lang="ts">
import { nextTick, ref } from 'vue'
import LocalThemeDialog from '@/components/LocalThemeDialog.vue'
import type { LocalThemeRecord } from '@/models/local-theme.model'

defineProps<{ themes: ReadonlyArray<LocalThemeRecord>; activeThemeId: string; storageError: string | null }>()
const emit = defineEmits<{ create: []; open: [id: string]; rename: [id: string, name: string]; duplicate: [id: string]; delete: [id: string]; close: [] }>()
const dialog = ref<{ $el: HTMLDialogElement } | null>(null)
const opener = ref<HTMLButtonElement | null>(null)
function relayRename(id: string, name: string): void { emit('rename', id, name) }

async function openManager(event: MouseEvent): Promise<void> {
  opener.value = event.currentTarget as HTMLButtonElement
  await nextTick()
  const element = dialog.value?.$el
  if (!element) return
  if (typeof element.showModal === 'function') element.showModal()
  else element.setAttribute('open', '')
  await nextTick()
  element.querySelector<HTMLElement>('[aria-label="Create theme"]')?.focus()
}
function restoreFocus(): void {
  const target = opener.value ?? document.querySelector<HTMLButtonElement>('[aria-label="Manage themes"]')
  emit('close')
  target?.focus()
  nextTick(() => target?.focus())
}
</script>

<template>
  <div data-local-theme-manager>
    <button ref="opener" type="button" aria-label="Manage themes" @click="openManager">Manage themes</button>
    <span data-active-theme-name>{{ activeThemeId ? themes.find(({ id }) => id === activeThemeId)?.name : '' }}</span>
    <p v-if="storageError" role="status" aria-live="polite" data-local-theme-storage-status>{{ storageError }}</p>
    <LocalThemeDialog ref="dialog" :themes="themes" :active-theme-id="activeThemeId" :storage-error="storageError" @create="emit('create')" @open="emit('open', $event)" @rename="relayRename" @duplicate="emit('duplicate', $event)" @delete="emit('delete', $event)" @close="restoreFocus" />
  </div>
</template>
