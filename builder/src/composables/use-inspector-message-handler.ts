import type { InspectorMessageHandlerOptions } from '@/models/inspector-message-handler-options.model'
import { INSPECTOR_PROTOCOL_VERSION, isInspectorEvent, type InspectorCommand } from '@/utils/inspector-protocol'
import { resolveInspectorTarget } from '@/registry/theme-registry'

export function useInspectorMessageHandler({
  inspectorRegistry,
  inspectorEnabled,
  inspectorResolution,
  selectedInspectorEvidence,
  selectedEditorSection,
  rawSelector,
  rawSelectorError,
  rawSelectorProposal,
}: InspectorMessageHandlerOptions) {
  return function handleInspectorMessageForTarget(
    event: MessageEvent,
    target: Window | null,
    targetOrigin: string,
  ): void {
    if (!target || event.source !== target || event.origin !== targetOrigin || !isInspectorEvent(event.data)) return
    const message = event.data
    if (message.type === 'ftb:inspector:ready') {
      if (inspectorEnabled.value) {
        const command: InspectorCommand = {
          type: 'ftb:inspector:enable',
          protocolVersion: INSPECTOR_PROTOCOL_VERSION,
        }
        target.postMessage(command, targetOrigin)
      }
      return
    }
    if (message.type === 'ftb:inspector:clear') {
      inspectorResolution.value = null
      selectedInspectorEvidence.value = null
      rawSelector.value = ''
      return
    }
    const resolution = resolveInspectorTarget(inspectorRegistry, message.target)
    inspectorResolution.value = resolution
    if (message.type !== 'ftb:inspector:select') return
    selectedInspectorEvidence.value = message.target
    rawSelectorError.value = undefined
    rawSelector.value = rawSelectorProposal.value.selector ?? ''
    selectedEditorSection.value =
      resolution.status === 'editable' && resolution.editorTarget === 'form.product-name' ? 'components' : 'inspector'
    if (resolution.status === 'editable' && resolution.editorTarget === 'form.product-name') {
      document.querySelector('[data-editor-target="form.product-name"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
}
