<script setup lang="ts">
import { ref } from 'vue'
import { createThemePairingClient } from '@/composables/use-theme-pairing'
import type { ThemePairing } from '@/models/theme-import-pairing.model'

const status = ref('')
const starting = ref(false)
const paired = ref(false)
let pairing: ThemePairing | null = null

async function startPairing(): Promise<void> {
  starting.value = true
  try {
    pairing = await createThemePairingClient().start()
    paired.value = true
    status.value = 'Pairing request created; waiting for the local client.'
  } catch {
    pairing = null
    paired.value = false
    status.value = 'Local pairing is unavailable.'
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <button type="button" aria-label="Pair local client" :disabled="starting || paired" @click="startPairing">
    {{ paired ? 'Pairing pending' : 'Pair local client' }}
  </button>
  <p v-if="status" role="status" aria-live="polite">{{ status }}</p>
</template>
