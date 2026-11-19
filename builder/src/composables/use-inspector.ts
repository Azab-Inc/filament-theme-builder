import { onBeforeUnmount, onMounted, ref } from 'vue'

import type { UseInspectorOptions } from '@/models/inspector-composable-options.model'
import type { InspectorTargetEvidence } from '@/models/inspector-target-evidence.model'
import { useInspectorMessageHandler } from '@/composables/use-inspector-message-handler'
import {
  INSPECTOR_PROTOCOL_VERSION,
  isInspectorEvent,
  type InspectorCommand,
  type InspectorResolution,
} from '@/utils/inspector-protocol'

export function useInspector({
  iframe,
  previewUrl,
  inspectorRegistry,
  selectedEditorSection,
  rawSelector,
  rawSelectorError,
  rawSelectorProposal,
  selectedInspectorEvidence = ref<InspectorTargetEvidence | null>(null),
}: UseInspectorOptions) {
  const inspectorEnabled = ref(false)
  const inspectorResolution = ref<InspectorResolution | null>(null)
  const previewHandshakeReady = ref(false)
  const targetOrigin = new URL(previewUrl, window.location.href).origin
  const handleInspectorMessageForTarget = useInspectorMessageHandler({
    inspectorRegistry,
    inspectorEnabled,
    inspectorResolution,
    selectedInspectorEvidence,
    selectedEditorSection,
    rawSelector,
    rawSelectorError,
    rawSelectorProposal,
  })

  function postInspectorCommand(enabled = inspectorEnabled.value): void {
    const target = iframe.value?.contentWindow
    if (!target) return
    const command: InspectorCommand = {
      type: enabled ? 'ftb:inspector:enable' : 'ftb:inspector:disable',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
    }
    target.postMessage(command, targetOrigin)
  }

  function postPreviewHandshake(): void {
    const target = iframe.value?.contentWindow
    if (!target) return
    target.postMessage({ type: 'ftb:preview:handshake', protocolVersion: INSPECTOR_PROTOCOL_VERSION }, targetOrigin)
  }

  function toggleInspector(): void {
    inspectorEnabled.value = !inspectorEnabled.value
    inspectorResolution.value = null
    postInspectorCommand()
  }

  function handleInspectorMessage(event: MessageEvent): void {
    if (event.source === iframe.value?.contentWindow && event.origin === targetOrigin && isInspectorEvent(event.data) && (event.data.type === 'ftb:preview:ready' || event.data.type === 'ftb:inspector:ready')) {
      previewHandshakeReady.value = true
      window.dispatchEvent(new Event('ftb:preview-ready'))
    }
    handleInspectorMessageForTarget(event, iframe.value?.contentWindow ?? null, targetOrigin)
  }

  function handlePreviewLoad(): void {
    previewHandshakeReady.value = false
    inspectorResolution.value = null
    selectedInspectorEvidence.value = null
    postInspectorCommand()
    postPreviewHandshake()
  }

  onMounted(() => {
    window.addEventListener('message', handleInspectorMessage)
    postInspectorCommand()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleInspectorMessage)
  })

  return {
    inspectorEnabled,
    inspectorResolution,
    previewHandshakeReady,
    selectedInspectorEvidence,
    toggleInspector,
    handleInspectorMessage,
    postInspectorCommand,
    postPreviewHandshake,
    onPreviewLoad: handlePreviewLoad,
  }
}
