import { onBeforeUnmount, onMounted, ref, type ComputedRef, type Ref } from 'vue'

import type { FilamentRegistry } from '@/models/theme-registry.model'
import {
  INSPECTOR_PROTOCOL_VERSION,
  isInspectorEvent,
  type InspectorCommand,
  type InspectorResolution,
  type InspectorTargetEvidence,
} from '@/utils/inspector-protocol'
import { resolveInspectorTarget } from '@/registry/theme-registry'

export type EditorSection = 'foundations' | 'components' | 'branding' | 'icons' | 'inspector'

type RawSelectorProposal = { selector: string | null; quality: string }

type UseInspectorOptions = {
  iframe: Ref<HTMLIFrameElement | undefined>
  previewUrl: string
  inspectorRegistry: FilamentRegistry
  selectedEditorSection: Ref<EditorSection>
  rawSelector: Ref<string>
  rawSelectorError: Ref<string | undefined>
  rawSelectorProposal: ComputedRef<RawSelectorProposal>
}

export function useInspector({
  iframe,
  previewUrl,
  inspectorRegistry,
  selectedEditorSection,
  rawSelector,
  rawSelectorError,
  rawSelectorProposal,
}: UseInspectorOptions) {
  const inspectorEnabled = ref(false)
  const inspectorResolution = ref<InspectorResolution | null>(null)
  const selectedInspectorEvidence = ref<InspectorTargetEvidence | null>(null)
  const targetOrigin = new URL(previewUrl, window.location.href).origin

  function postInspectorCommand(enabled = inspectorEnabled.value): void {
    const target = iframe.value?.contentWindow
    if (!target) return
    const command: InspectorCommand = {
      type: enabled ? 'ftb:inspector:enable' : 'ftb:inspector:disable',
      protocolVersion: INSPECTOR_PROTOCOL_VERSION,
    }
    target.postMessage(command, targetOrigin)
  }

  function toggleInspector(): void {
    inspectorEnabled.value = !inspectorEnabled.value
    inspectorResolution.value = null
    postInspectorCommand()
  }

  function handleInspectorMessage(event: MessageEvent): void {
    const target = iframe.value?.contentWindow
    if (
      !target ||
      event.source !== target ||
      event.origin !== targetOrigin ||
      !isInspectorEvent(event.data)
    )
      return
    const message = event.data
    if (message.type === 'ftb:inspector:ready') {
      if (inspectorEnabled.value) postInspectorCommand(true)
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
    if (message.type === 'ftb:inspector:select') {
      selectedInspectorEvidence.value = message.target
      rawSelectorError.value = undefined
      rawSelector.value = rawSelectorProposal.value.selector ?? ''
      selectedEditorSection.value =
        resolution.status === 'editable' && resolution.editorTarget === 'form.product-name'
          ? 'components'
          : 'inspector'
    }
    if (
      message.type === 'ftb:inspector:select' &&
      resolution.status === 'editable' &&
      resolution.editorTarget === 'form.product-name'
    ) {
      document
        .querySelector('[data-editor-target="form.product-name"]')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  function handlePreviewLoad(): void {
    inspectorResolution.value = null
    selectedInspectorEvidence.value = null
    postInspectorCommand()
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
    selectedInspectorEvidence,
    toggleInspector,
    handleInspectorMessage,
    postInspectorCommand,
    onPreviewLoad: handlePreviewLoad,
  }
}
