<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { useThemeImport } from '@/composables/use-theme-import'
import ThemeImportSummary from '@/components/ThemeImportSummary.vue'
import type { BrowserPayload, BrowserRelay } from '@/composables/use-theme-relay'

const fileInput = ref<HTMLInputElement | null>(null)
const model = useThemeImport(useThemeStore())
async function selectFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) await model.chooseFile(input.files[0])
  input.value = ''
}
function receiveRelayPayload(payload: BrowserPayload, relay: BrowserRelay): Promise<void> { return model.receiveRelayPayload(payload, relay) }
defineExpose({ receiveRelayPayload })
</script>

<template>
  <button type="button" aria-label="Import theme" @click="fileInput?.click()">Import theme</button>
  <input ref="fileInput" class="hidden" type="file" accept=".json,application/json" aria-label="Theme JSON file" @change="selectFile" />
  <dialog v-if="model.state.open" open role="dialog" aria-label="Import preview" class="m-auto max-h-[90vh] w-[min(36rem,calc(100%-2rem))] rounded-lg border border-slate-300 bg-white p-6 text-slate-900 shadow-xl">
    <h2 class="text-xl font-semibold">Import preview</h2>
    <p v-if="model.state.error" role="alert" class="my-3 text-red-700">{{ model.state.error }}</p>
    <template v-if="model.state.preview">
      <label class="my-3 block">Theme name
        <input class="mt-1 block w-full rounded border border-slate-400 p-2" aria-label="Theme name" :value="model.state.proposedName" @input="model.setName(($event.target as HTMLInputElement).value)" />
      </label>
      <ThemeImportSummary :preview="model.state.preview" :filename="model.state.filename" />
      <p>Review this preview. Confirming creates a new theme and opens it; it does not replace an existing theme.</p>
      <button type="button" aria-label="Confirm import" :disabled="model.state.applying" @click="model.confirm()">Confirm import</button>
    </template>
    <button type="button" aria-label="Cancel import" :disabled="model.state.applying || !model.state.canCancel" @click="model.cancel()">Cancel import</button>
  </dialog>
</template>
