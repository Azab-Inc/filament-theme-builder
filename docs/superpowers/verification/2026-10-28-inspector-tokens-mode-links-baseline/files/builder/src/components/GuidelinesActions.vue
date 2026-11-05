<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import GuidelinesSampleDashboard from '@/components/GuidelinesSampleDashboard.vue'

const open = ref(false)
const exportButton = ref<HTMLButtonElement | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const name = ref('Northstar admin')
const history = ref(['Northstar admin'])
const cursor = ref(0)
const canUndo = ref(false)
const canRedo = ref(false)
function recordName() {
  if (name.value === history.value[cursor.value]) return
  history.value = history.value.slice(0, cursor.value + 1).concat(name.value)
  cursor.value = history.value.length - 1; canUndo.value = cursor.value > 0; canRedo.value = false
}
function undo() { if (cursor.value) { cursor.value--; name.value = history.value[cursor.value]!; canUndo.value = cursor.value > 0; canRedo.value = true } }
function redo() { if (cursor.value < history.value.length - 1) { cursor.value++; name.value = history.value[cursor.value]!; canUndo.value = true; canRedo.value = cursor.value < history.value.length - 1 } }
async function openDialog() { open.value = true; await nextTick(); if (!dialog.value?.open) dialog.value?.showModal(); dialog.value?.querySelector<HTMLButtonElement>('[data-autofocus]')?.focus() }
function closeDialog() { if (dialog.value?.open) dialog.value.close(); open.value = false; nextTick(() => exportButton.value?.focus()) }
function onCancel(event: Event) { event.preventDefault(); closeDialog() }
watch(open, value => { if (!value && dialog.value?.open) dialog.value.close() })
onBeforeUnmount(() => { if (dialog.value?.open) dialog.value.close() })
</script>

<template>
  <section class="gp-shell"><header><b>Theme builder</b><span>Editing a memory-only design draft</span><div class="gp-actions"><button :disabled="!canUndo" @click="undo">Undo</button><button :disabled="!canRedo" @click="redo">Redo</button><button ref="exportButton" class="gp-primary" @click="openDialog">Export</button></div></header>
    <div class="gp-body"><aside><strong>Theme identity</strong><label>Theme name<input v-model="name" @input="recordName" /></label><p>Keep identity and editing together; group formats behind one Export disclosure.</p></aside>
      <article><h1>Action hierarchy</h1><p>Prioritize the next useful editing action instead of six peer exports.</p><GuidelinesSampleDashboard :theme-name="name" /><dialog ref="dialog" aria-label="Export handoff" @cancel="onCancel"><h2>Export handoff</h2><p>Choose a labeled mock handoff. Nothing downloads or saves in this prototype.</p><button data-autofocus @click="closeDialog">Export JSON mock</button><button @click="closeDialog">Export CSS mock</button><button aria-label="Close export handoff" @click="closeDialog">Close</button></dialog></article></div>
  </section>
</template>
