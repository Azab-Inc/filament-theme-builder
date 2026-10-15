import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import type { EditorNavigationMode, EditorSection } from '@/models/editor.model'
import type { ThemeMode } from '@/models/foundations.model'
import { CURATED_FONT_CHOICES, PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { createThemeRegistry } from '@/registry/theme-registry'
import { proposeRawSelector } from '@/utils/raw-override-validation'
import { useThemeStore } from '@/stores/theme'
import { useRecovery } from '@/composables/use-recovery'
import { usePreviewTheme } from '@/composables/use-preview-theme'
import { useInspector } from '@/composables/use-inspector'
import type { FoundationFontChoiceOption } from '@/components/foundations-typography-layout-controls.model'

export function useBuilderState(previewUrl: string) {
  const theme = useThemeStore()
  const { canUndo, canRedo } = storeToRefs(theme)
  const { restoreLegacyRecovery, downloadLegacyRecovery } = useRecovery(theme)
  const iframe = ref<HTMLIFrameElement>()
  const rawSelector = ref('')
  const rawSelectorError = ref<string | undefined>()
  const exportStatus = ref('')
  const activeMode = ref<ThemeMode>('light')
  const editorNavigationMode = ref<EditorNavigationMode>('sidebar')
  const selectedEditorSection = ref<EditorSection>('foundations')
  const foundationErrors = ref<Record<string, string>>({})
  const uploadErrors = ref<Record<string, string>>({})
  const inspectorEvidence = ref<import('@/utils/inspector-protocol').InspectorTargetEvidence | null>(null)
  const inspectorRegistry = createThemeRegistry()
  const defaultFoundation = createDefaultFoundationState()
  const foundation = computed(() => theme.theme.foundations)
  const paletteNames = PALETTE_NAMES
  const paletteShades = PALETTE_SHADES
  const editorSections: ReadonlyArray<{ id: EditorSection; label: string }> = [
    { id: 'foundations', label: 'Foundations' }, { id: 'components', label: 'Components' },
    { id: 'branding', label: 'Branding' }, { id: 'icons', label: 'Icons' },
  ]
  const fontChoices: ReadonlyArray<FoundationFontChoiceOption> = [
    { value: 'system', label: 'System', font: { kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' } },
    { value: 'system-mono', label: 'System Mono', font: { kind: 'system', name: 'System Mono', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' } },
    ...CURATED_FONT_CHOICES.map((font) => ({ value: `curated:${font.name}`, label: font.name, font: { kind: 'curated' as const, ...font } })),
    { value: 'custom', label: 'Custom family' },
  ]
  const rawSelectorProposal = computed(() => inspectorEvidence.value
    ? proposeRawSelector(inspectorEvidence.value, inspectorRegistry)
    : { selector: null, quality: 'unavailable' as const })
  const inspector = useInspector({ iframe, previewUrl, inspectorRegistry, selectedEditorSection, rawSelector, rawSelectorError, rawSelectorProposal, selectedInspectorEvidence: inspectorEvidence })
  const preview = usePreviewTheme({ theme, activeMode, previewUrl, iframe, onPreviewLoad: inspector.onPreviewLoad })
  watch(rawSelectorProposal, (proposal) => {
    if (!rawSelector.value || rawSelectorError.value) rawSelector.value = proposal.selector ?? ''
  }, { immediate: true })
  return { theme, canUndo, canRedo, restoreLegacyRecovery, downloadLegacyRecovery, iframe, rawSelector, rawSelectorError, exportStatus, activeMode, editorNavigationMode, selectedEditorSection, foundationErrors, uploadErrors, inspectorRegistry, defaultFoundation, foundation, paletteNames, paletteShades, editorSections, fontChoices, inspector, preview }
}

export type { BuilderState } from '@/models/builder-state.model'
export type { BuilderRef } from '@/models/builder-ref.model'
export type { BuilderScopeRequest } from '@/models/builder-scope-request.model'
export type { BuilderOverride } from '@/models/builder-override.model'
