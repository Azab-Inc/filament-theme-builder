<script setup lang="ts">
import { nextTick, ref } from 'vue'
import type { LocalThemeRecord } from '@/models/local-theme.model'

defineProps<{ themes: ReadonlyArray<LocalThemeRecord>; activeThemeId: string; storageError: string | null }>()
const emit = defineEmits<{ save: []; create: []; open: [id: string]; rename: [id: string, name: string]; duplicate: [id: string]; delete: [id: string]; close: [] }>()
const editingId = ref<string | null>(null)
const editName = ref('')
const renameError = ref('')
const deleting = ref<LocalThemeRecord | null>(null)
const confirmation = ref<HTMLElement | null>(null)

function startRename(theme: LocalThemeRecord): void { editingId.value = theme.id; editName.value = theme.name; renameError.value = '' }
function saveRename(id: string): void {
  const name = editName.value.trim()
  if (!name) { renameError.value = 'A theme name is required.'; return }
  emit('rename', id, name); editingId.value = null
}
function requestDelete(theme: LocalThemeRecord): void {
  deleting.value = theme
  nextTick(() => nextTick(() => confirmation.value?.querySelector<HTMLElement>('button')?.focus()))
}
function cancelDelete(): void { deleting.value = null }
function confirmDelete(): void {
  if (!deleting.value) return
  const id = deleting.value.id
  deleting.value = null
  emit('delete', id)
}
function handleEscape(event: KeyboardEvent): void {
  if (deleting.value) { cancelDelete(); return }
  requestClose(event.currentTarget as HTMLDialogElement)
}
function requestClose(element: HTMLDialogElement): void {
  if (typeof element.close === 'function') element.close()
  else { element.removeAttribute('open'); emit('close') }
}
</script>

<template>
  <dialog aria-labelledby="local-theme-dialog-title" @close="emit('close')" @keydown.esc.prevent="handleEscape">
    <h2 id="local-theme-dialog-title">Manage themes</h2>
    <p v-if="storageError" role="status" aria-live="polite" data-local-theme-storage-status>{{ storageError }}</p>
    <button type="button" aria-label="Save theme" :disabled="Boolean(deleting)" @click="emit('save')">Save theme</button>
    <button type="button" aria-label="Create theme" :disabled="Boolean(deleting)" @click="emit('create')">Create theme</button>
    <ul aria-label="Local themes">
      <li v-for="theme in themes" :key="theme.id" :data-local-theme-row="theme.id" :aria-current="theme.id === activeThemeId ? 'true' : undefined">
        <strong>{{ theme.name }}</strong>
        <span v-if="theme.id === activeThemeId">Active</span>
        <template v-if="editingId === theme.id">
          <label>Theme name <input v-model="editName" aria-label="Rename theme name" @keydown.enter.prevent="saveRename(theme.id)" /></label>
          <p v-if="renameError" role="alert" data-local-theme-rename-error>{{ renameError }}</p>
          <button type="button" aria-label="Save theme name" @click="saveRename(theme.id)">Save</button>
        </template>
        <template v-else>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Open ${theme.name}`" @click="emit('open', theme.id)">Open</button>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Rename ${theme.name}`" @click="startRename(theme)">Rename</button>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Duplicate ${theme.name}`" @click="emit('duplicate', theme.id)">Duplicate</button>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Delete ${theme.name}`" @click="requestDelete(theme)">Delete</button>
        </template>
      </li>
    </ul>
    <section v-if="deleting" ref="confirmation" role="alertdialog" aria-modal="true" aria-labelledby="local-theme-delete-title">
      <h3 id="local-theme-delete-title">Delete {{ deleting.name }}?</h3>
      <p>This action cannot be undone.</p>
      <button type="button" :aria-label="`Confirm delete ${deleting.name}`" @click="confirmDelete">Delete theme</button>
      <button type="button" aria-label="Cancel delete" @click="cancelDelete">Cancel</button>
    </section>
    <button type="button" :disabled="Boolean(deleting)" aria-label="Close theme manager" @click="requestClose(($event.currentTarget as HTMLButtonElement).closest('dialog') as HTMLDialogElement)">Close</button>
  </dialog>
</template>
