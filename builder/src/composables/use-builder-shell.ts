import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ALL_RAW_VISUAL_PROPERTIES } from '@/models/raw-overrides.model'
import { classifyRawSelector } from '@/utils/raw-override-validation'
import { inspectorStateForSelector } from '@/utils/raw-inspector-state'
import { useBuilderState } from './use-builder-state'
import { useBuilderFoundations } from './use-builder-foundations'
import { useBuilderControls } from './use-builder-controls'
import { useBuilderExports } from './use-builder-exports'
import { useBuilderActions } from './use-builder-actions'
import { useBrandingUpload } from './use-branding-upload'

export function useBuilderShell(previewUrl: string) {
  const state = useBuilderState(previewUrl)
  const foundations = useBuilderFoundations(state)
  const controls = useBuilderControls(state)
  const exports = useBuilderExports(state)
  const actions = useBuilderActions(state)
  const uploads = useBrandingUpload(state)
  const selectedRawOverride = computed(() => state.theme.theme.rawOverrides.find((override) => override.selector === state.rawSelector.value))
  const rawSelectorClassification = computed(() => state.rawSelector.value ? classifyRawSelector(state.rawSelector.value) : { selector: null, quality: 'unavailable' as const })
  const rawInspectorState = computed(() => inspectorStateForSelector(state.rawSelector.value))
  const primaryColor = foundations.primaryColor
  function setPreviewIframe(element: HTMLIFrameElement | null): void { state.iframe.value = element ?? undefined }
  function handleKeydown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
    if (event.target instanceof HTMLInputElement && event.target.type !== 'color') return
    event.preventDefault(); event.shiftKey ? state.theme.redo() : state.theme.undo()
  }
  onMounted(() => window.addEventListener('keydown', handleKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
  return { ...state, ...foundations, ...controls, ...exports, ...actions, ...uploads, primaryColor, setPreviewIframe, handleKeydown, rawProperties: ALL_RAW_VISUAL_PROPERTIES, rawSelectorClassification, rawInspectorState, selectedRawOverride }
}

export type { BuilderShell } from '@/models/builder-shell.model'
