<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { useThemeStore } from '@/stores/theme'
import { createThemePairingClient } from '@/composables/use-theme-pairing'
import { createThemeRelayClient, type BrowserPayload, type BrowserRelay } from '@/composables/use-theme-relay'
import { handleRelayNotices } from '@/composables/use-theme-relay-operations'
import type { ThemePairing } from '@/models/theme-import-pairing.model'

const props = defineProps<{ onImportPayload?: (payload: BrowserPayload, relay: BrowserRelay) => Promise<void> }>()
const status = ref(''); const claimId = ref(''); const starting = ref(false); const paired = ref(false); const pairing = shallowRef<ThemePairing | null>(null)
const store = useThemeStore(); let claimTimer: number | null = null; let stopRelay: (() => void) | null = null
let relay: BrowserRelay | null = null; const handling = new Set<string>()
async function startPairing(): Promise<void> {
  starting.value = true
  try {
    pairing.value = await createThemePairingClient().start(); status.value = 'Pairing request created; waiting for a local MCP client.'
    await checkClaim()
    if (pairing.value) claimTimer = window.setInterval(() => { void checkClaim() }, 2_000)
  }
  catch { clearPairing(); status.value = 'Local pairing is unavailable.' }
  finally { starting.value = false }
}
async function checkClaim(): Promise<void> {
  if (!pairing.value) return
  try {
    const result = await createThemePairingClient().status(pairing.value)
    if (result.status !== 'pending') { clearPairing(); status.value = result.status === 'expired' ? 'Pairing request expired.' : 'Pairing request disconnected.'; return }
    if (result.claimId) { claimId.value = result.claimId; status.value = 'A local MCP client requests access. Approve only if you initiated this pairing.' }
  } catch { clearPairing(); status.value = 'Pairing request is no longer available.' }
}
async function approvePairing(): Promise<void> {
  const current = pairing.value
  if (!current || !claimId.value) return
  try {
    await createThemePairingClient().approve(current, claimId.value); clearClaimTimer(); claimId.value = ''
    relay = createThemeRelayClient(current)
    paired.value = true
    stopRelay = relay.start((notices) => { void handleRelayNotices(notices, relay!, store, async (payload, client) => {
      if (handling.has(payload.operationId)) return
      handling.add(payload.operationId)
      if (!props.onImportPayload) throw new Error('confirmation_unavailable')
      await props.onImportPayload(payload, client)
    }) }, () => { status.value = 'Local relay disconnected or expired.' })
    status.value = 'Local client connected.'
  } catch { clearPairing(); status.value = 'Pairing approval failed.' }
}
async function disconnect(): Promise<void> {
  const wasPaired = relay !== null
  let confirmed = true
  try { await relay?.disconnect() } catch { confirmed = false }
  stopRelay?.(); stopRelay = null; relay = null; paired.value = false; clearPairing(); handling.clear()
  status.value = confirmed ? (wasPaired ? 'Local client disconnected.' : 'Pairing request cancelled in this tab.') : 'Local disconnect could not be confirmed; relay lease will expire.'
}
function clearClaimTimer(): void { if (claimTimer !== null) window.clearInterval(claimTimer); claimTimer = null }
function clearPairing(): void { clearClaimTimer(); pairing.value?.tabKey.fill(0); pairing.value = null; claimId.value = '' }
onBeforeUnmount(() => {
  clearClaimTimer()
  if (relay) void relay.disconnect().catch(() => undefined).finally(clearPairing)
  else clearPairing()
})
</script>

<template>
  <section aria-label="Local client pairing" class="toolbar-pairing flex flex-wrap items-center gap-2">
    <button v-if="!pairing" type="button" aria-label="Pair local client" :disabled="starting" @click="startPairing">Pair local client</button>
    <button v-if="claimId" type="button" aria-label="Approve pairing" @click="approvePairing">Approve pairing</button>
    <button v-if="pairing && !claimId && !paired" type="button" aria-label="Cancel pairing" @click="disconnect">Cancel pairing</button>
    <button v-if="paired" type="button" aria-label="Disconnect local client" @click="disconnect">Disconnect local client</button>
    <code v-if="pairing" data-testid="pairing-id">{{ pairing.pairingId }}</code>
    <p v-if="claimId" role="alert">A local MCP client requests pairing. The client label is unverified.</p>
    <p v-if="status" role="status" aria-live="polite">{{ status }}</p>
  </section>
</template>
