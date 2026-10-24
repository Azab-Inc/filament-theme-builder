<script setup lang="ts">
import LocalThemeManager from '@/components/LocalThemeManager.vue'
import ThemeImportDialog from '@/components/ThemeImportDialog.vue'
import ThemePairingControl from '@/components/ThemePairingControl.vue'
import ColorField from '@/components/ColorField.vue'
import ToolbarMenu from '@/components/ToolbarMenu.vue'
import { useThemeRelayImportHandoff } from '@/composables/use-theme-relay-import-handoff'
import type { LocalThemeRecord } from '@/models/local-theme.model'
withDefaults(defineProps<{
  primaryColor: string
  canUndo: boolean
  canRedo: boolean
  inspectorEnabled: boolean
  inspectorStatus: string
  exportStatus: string
  runtimeLoading: boolean
  legacyRecoveryAvailable: boolean
  legacyRecoveryError: string | null
  themes?: ReadonlyArray<LocalThemeRecord>
  activeThemeId?: string
  storageError?: string | null
}>(), { themes: () => [], activeThemeId: '', storageError: null })

const emit = defineEmits<{
  'update:primaryColor': [color: string]
  exportCanonicalJson: []
  copyVanillaThemeCss: []
  exportVanillaThemeCss: []
  exportIconPhp: []
  exportBrandingJson: []
  exportBrandingPhp: []
  undo: []
  redo: []
  toggleInspector: []
  restoreLegacyRecovery: []
  downloadLegacyRecovery: []
  save: []
  create: []
  open: [id: string]
  rename: [id: string, name: string]
  duplicate: [id: string]
  delete: [id: string]
  close: []
}>()

function relayRename(id: string, name: string): void { emit('rename', id, name) }
const { dialog: importDialog, receive: receiveRelayImport } = useThemeRelayImportHandoff()
function updatePrimaryColor(event: Event): void {
  emit('update:primaryColor', (event.target as HTMLInputElement).value)
}
</script>

<template>
  <header class="preview-shell__header">
    <div class="preview-shell__header-copy">
      <h1>Filament Theme Builder</h1>
      <p data-demo-notice>Preview demo data is temporary.</p>
    </div>
    <div class="preview-shell__header-controls" data-editor-header-controls>
      <button type="button" class="toolbar-primary-action" aria-label="Save theme" @click="emit('save')">Save theme</button>
      <ColorField id="toolbar-primary-color" label="Primary color" visible-label="Primary color" text-label="Primary color text" :value="primaryColor" :effective-value="primaryColor" profile="hex6" :context-key="activeThemeId" native-label="Primary color" :native-primary="true" @input="updatePrimaryColor" />
      <ToolbarMenu label="Export" ariaLabel="Export actions">
        <button type="button" aria-label="Export theme JSON" @click="emit('exportCanonicalJson')">Export JSON</button>
        <button type="button" aria-label="Copy vanilla CSS" @click="emit('copyVanillaThemeCss')">Copy CSS</button>
        <button type="button" aria-label="Download vanilla CSS" @click="emit('exportVanillaThemeCss')">Download CSS</button>
        <button type="button" aria-label="Export PanelProvider icon config" @click="emit('exportIconPhp')">Export icon PHP</button>
        <button type="button" aria-label="Export panel branding JSON" @click="emit('exportBrandingJson')">Export branding JSON</button>
        <button type="button" aria-label="Export PanelProvider branding config" @click="emit('exportBrandingPhp')">Export branding PHP</button>
      </ToolbarMenu>
      <button type="button" aria-label="Undo" :disabled="!canUndo" @click="emit('undo')">Undo</button>
      <button type="button" aria-label="Redo" :disabled="!canRedo" @click="emit('redo')">Redo</button>
      <ToolbarMenu label="Tools" ariaLabel="Theme tools">
        <button type="button" aria-label="Inspector" :aria-pressed="inspectorEnabled" @click="emit('toggleInspector')">Inspector</button>
        <LocalThemeManager :themes="themes" :active-theme-id="activeThemeId" :storage-error="storageError" @save="emit('save')" @create="emit('create')" @open="emit('open', $event)" @rename="relayRename" @duplicate="emit('duplicate', $event)" @delete="emit('delete', $event)" @close="emit('close')" />
        <div class="toolbar-import"><ThemeImportDialog ref="importDialog" /></div>
        <ThemePairingControl :on-import-payload="receiveRelayImport" />
      </ToolbarMenu>
    </div>
  </header>
  <p v-if="exportStatus" role="status" aria-label="Export status" aria-live="polite" data-export-status>{{ exportStatus }}</p>
  <p role="status" aria-label="Inspector status" aria-live="polite" data-inspector-status>{{ inspectorStatus }}</p>
  <p v-if="runtimeLoading" role="status" aria-live="polite" data-preview-loading>Refreshing runtime preview…</p>
  <aside v-if="legacyRecoveryAvailable" role="alert" class="legacy-recovery">
    <strong>Legacy customization archived.</strong>
    <span>Unversioned foundation values are ambiguous; restore marks non-default legacy values explicit.</span>
    <p v-if="legacyRecoveryError" role="status">{{ legacyRecoveryError }}</p>
    <button type="button" aria-label="Restore legacy customization" :disabled="!!legacyRecoveryError" @click="emit('restoreLegacyRecovery')">
      Restore legacy customization
    </button>
    <button type="button" aria-label="Download archived legacy JSON" @click="emit('downloadLegacyRecovery')">
      Download archived JSON
    </button>
  </aside>
</template>
