<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useThemeImport } from '@/composables/use-theme-import'
import ThemeImportSummary from '@/components/ThemeImportSummary.vue'
import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'

const fileInput = ref<HTMLInputElement | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const opener = ref<HTMLElement | null>(null)
const focusFallback = ref<HTMLElement | null>(null)
const model = useThemeImport(useThemeStore())
let backdropPointer = false
function isVisible(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element && element !== document.body && element !== document.documentElement
    && element.isConnected && element.getClientRects().length && !element.closest('[inert]'))
}
function rememberOpener(element: HTMLElement | null): void {
  opener.value = isVisible(element) ? element : null
  focusFallback.value = fileInput.value?.closest('details')?.querySelector('summary') ?? null
}
function restoreFocus(): void {
  const target = isVisible(opener.value) ? opener.value : isVisible(focusFallback.value) ? focusFallback.value : null
  target?.focus()
  opener.value = null
  focusFallback.value = null
}
watch(() => model.state.open, async (open) => {
  await nextTick()
  if (open && dialog.value && !dialog.value.open) {
    dialog.value.showModal()
    dialog.value.querySelector<HTMLElement>('input:not([type="file"]), button')?.focus()
  } else if (!open && dialog.value?.open) dialog.value.close()
  if (!open) nextTick(restoreFocus)
}, { flush: 'post' })
function openPicker(event: MouseEvent): void { rememberOpener(event.currentTarget as HTMLButtonElement); fileInput.value?.click() }
function cancelDialog(event: Event): void {
  if (model.state.applying || !model.state.canCancel) { event.preventDefault(); return }
  model.cancel()
}
function pointerDown(event: PointerEvent): void { backdropPointer = event.target === event.currentTarget }
function pointerUp(event: PointerEvent): void {
  if (backdropPointer && event.target === event.currentTarget && !model.state.applying && model.state.canCancel) model.cancel()
  backdropPointer = false
}
async function selectFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) await model.chooseFile(input.files[0])
  input.value = ''
}
async function confirmImport(): Promise<void> {
  const result = await model.confirm()
  if (!result.ok) nextTick(() => dialog.value?.querySelector<HTMLElement>('[role="alert"]')?.focus())
}
function receiveRelayPayload(payload: BrowserPayload, relay: BrowserRelay): Promise<void> {
  if (!model.state.open) rememberOpener(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  return model.receiveRelayPayload(payload, relay)
}
defineExpose({ receiveRelayPayload })
onUnmounted(() => { backdropPointer = false })
</script>

<template>
  <button type="button" aria-label="Import theme" @click="openPicker">Import theme</button>
  <input ref="fileInput" class="hidden" type="file" accept=".json,application/json" aria-label="Theme JSON file" @change="selectFile" />
  <Teleport to="body">
  <dialog v-if="model.state.open" ref="dialog" data-toolbar-menu-modal role="dialog" aria-label="Import preview" class="m-auto max-h-[90vh] w-[min(36rem,calc(100%-2rem))] overscroll-contain rounded-lg border border-slate-300 bg-white p-6 text-slate-900 shadow-xl" @cancel="cancelDialog" @pointerdown="pointerDown" @pointerup="pointerUp">
    <h2 class="text-xl font-semibold">Import preview</h2>
    <p v-if="model.state.error" role="alert" tabindex="-1" class="my-3 text-red-700">{{ model.state.error }}</p>
    <template v-if="model.state.preview">
      <label class="my-3 block">Theme name
        <input name="theme-name" autocomplete="off" spellcheck="false" class="mt-1 block w-full rounded border border-slate-400 p-2" aria-label="Theme name" :value="model.state.proposedName" @input="model.setName(($event.target as HTMLInputElement).value)" />
      </label>
      <ThemeImportSummary :preview="model.state.preview" :filename="model.state.filename" />
      <p>Review this preview. Confirming creates a new theme and opens it; it does not replace an existing theme.</p>
      <button type="button" aria-label="Confirm import" :disabled="model.state.applying" @click="confirmImport">Confirm import</button>
    </template>
    <button type="button" aria-label="Cancel import" :disabled="model.state.applying || !model.state.canCancel" @click="model.cancel()">Cancel import</button>
  </dialog>
  </Teleport>
</template>
