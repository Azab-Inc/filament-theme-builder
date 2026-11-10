<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import type { LocalThemeRecord } from '@/models/local-theme.model'

defineProps<{ themes: ReadonlyArray<LocalThemeRecord>; activeThemeId: string; storageError: string | null }>()
const emit = defineEmits<{ save: []; create: []; open: [id: string]; rename: [id: string, name: string]; duplicate: [id: string]; delete: [id: string]; close: [] }>()
const editingId = ref<string | null>(null)
const editName = ref('')
const renameError = ref('')
const deleting = ref<LocalThemeRecord | null>(null)
const confirmation = ref<HTMLElement | null>(null)
const confirmationOpener = ref<HTMLButtonElement | null>(null)
const renameOpener = ref<HTMLButtonElement | null>(null)
let backdropPointer = false

async function startRename(theme: LocalThemeRecord, event: MouseEvent): Promise<void> {
  renameOpener.value = event.currentTarget as HTMLButtonElement
  editingId.value = theme.id; editName.value = theme.name; renameError.value = ''
  await nextTick()
  document.querySelector<HTMLInputElement>('[aria-label="Rename theme name"]')?.focus()
}
function saveRename(id: string): void {
  const name = editName.value.trim()
  if (!name) { renameError.value = 'A theme name is required.'; return }
  emit('rename', id, name); editingId.value = null
  nextTick(() => document.querySelector<HTMLButtonElement>(`[data-local-theme-row="${id}"] [aria-label^="Rename "]`)?.focus())
}
function requestDelete(theme: LocalThemeRecord, event: MouseEvent): void {
  deleting.value = theme
  confirmationOpener.value = event.currentTarget as HTMLButtonElement
  nextTick(() => nextTick(() => confirmation.value?.querySelector<HTMLElement>('[aria-label="Cancel delete"]')?.focus()))
}
function cancelDelete(): void { deleting.value = null; nextTick(() => confirmationOpener.value?.focus()) }
function confirmDelete(): void {
  if (!deleting.value) return
  const id = deleting.value.id
  deleting.value = null
  emit('delete', id)
}
function handleEscape(event: KeyboardEvent): void {
  if (deleting.value) { event.stopPropagation(); cancelDelete(); return }
  event.stopPropagation()
  requestClose(event.currentTarget as HTMLDialogElement)
}
function pointerDown(event: PointerEvent): void { backdropPointer = event.target === event.currentTarget }
function pointerUp(event: PointerEvent): void {
  if (backdropPointer && event.target === event.currentTarget && !deleting.value) requestClose(event.currentTarget as HTMLDialogElement)
  backdropPointer = false
}
watch(editingId, (id, previous) => {
  if (!id && previous) { renameError.value = ''; editName.value = ''; renameOpener.value?.focus(); renameOpener.value = null }
})
function requestClose(element: HTMLDialogElement): void {
  if (typeof element.close === 'function') element.close()
  else { element.removeAttribute('open'); emit('close') }
}
function resetOnClose(): void {
  editingId.value = null; editName.value = ''; renameError.value = ''; deleting.value = null
  emit('close')
}
</script>

<template>
  <dialog class="local-theme-dialog" data-toolbar-menu-modal aria-labelledby="local-theme-dialog-title" @close="resetOnClose" @keydown.esc.prevent="handleEscape" @pointerdown="pointerDown" @pointerup="pointerUp">
    <h2 id="local-theme-dialog-title" :inert="Boolean(deleting)">Manage themes</h2>
    <p v-if="storageError" :inert="Boolean(deleting)" role="status" aria-live="polite" data-local-theme-storage-status>{{ storageError }}</p>
    <button type="button" aria-label="Save theme" :disabled="Boolean(deleting)" :inert="Boolean(deleting)" @click="emit('save')">Save theme</button>
    <button type="button" aria-label="Create theme" :disabled="Boolean(deleting)" :inert="Boolean(deleting)" @click="emit('create')">Create theme</button>
    <ul aria-label="Local themes" :inert="Boolean(deleting)">
      <li v-for="theme in themes" :key="theme.id" :data-local-theme-row="theme.id" :aria-current="theme.id === activeThemeId ? 'true' : undefined">
        <strong>{{ theme.name }}</strong>
        <span v-if="theme.id === activeThemeId">Active</span>
        <template v-if="editingId === theme.id">
          <label>Theme name <input v-model="editName" name="theme-name" autocomplete="off" spellcheck="false" aria-label="Rename theme name" @keydown.enter.prevent="saveRename(theme.id)" /></label>
          <p v-if="renameError" role="alert" data-local-theme-rename-error>{{ renameError }}</p>
          <button type="button" aria-label="Save theme name" @click="saveRename(theme.id)">Save</button>
        </template>
        <template v-else>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Open ${theme.name}`" @click="emit('open', theme.id)">Open</button>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Rename ${theme.name}`" @click="startRename(theme, $event)">Rename</button>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Duplicate ${theme.name}`" @click="emit('duplicate', theme.id)">Duplicate</button>
          <button type="button" :disabled="Boolean(deleting)" :aria-label="`Delete ${theme.name}`" @click="requestDelete(theme, $event)">Delete</button>
        </template>
      </li>
    </ul>
    <section v-if="deleting" ref="confirmation" role="alertdialog" aria-modal="true" aria-labelledby="local-theme-delete-title" aria-describedby="local-theme-delete-warning" class="fixed inset-0 z-10 grid place-content-center bg-slate-950/50 p-6">
      <h3 id="local-theme-delete-title">Delete {{ deleting.name }}?</h3>
      <p id="local-theme-delete-warning">This action cannot be undone.</p>
      <button type="button" :aria-label="`Confirm delete ${deleting.name}`" @click="confirmDelete">Delete theme</button>
      <button type="button" aria-label="Cancel delete" @click="cancelDelete">Cancel</button>
    </section>
    <button type="button" :disabled="Boolean(deleting)" :inert="Boolean(deleting)" aria-label="Close theme manager" @click="requestClose(($event.currentTarget as HTMLButtonElement).closest('dialog') as HTMLDialogElement)">Close</button>
  </dialog>
</template>
