<script setup lang="ts">
defineProps<{
  primaryColor: string
  canUndo: boolean
  canRedo: boolean
  inspectorEnabled: boolean
  inspectorStatus: string
  exportStatus: string
  runtimeLoading: boolean
  legacyRecoveryAvailable: boolean
  legacyRecoveryError: string | null
}>()

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
}>()
</script>

<template>
  <header class="preview-shell__header">
    <div class="preview-shell__header-copy">
      <h1>Filament Theme Builder</h1>
      <p data-demo-notice>Preview demo data is temporary.</p>
    </div>
    <div class="preview-shell__header-controls" data-editor-header-controls>
      <label
        >Primary color
        <input :value="primaryColor" type="color" aria-label="Primary color" @input="emit('update:primaryColor', ($event.target as HTMLInputElement).value)" />
      </label>
      <button type="button" aria-label="Export theme JSON" @click="emit('exportCanonicalJson')">
        Export JSON
      </button>
      <button type="button" aria-label="Copy vanilla CSS" @click="emit('copyVanillaThemeCss')">
        Copy CSS
      </button>
      <button type="button" aria-label="Download vanilla CSS" @click="emit('exportVanillaThemeCss')">
        Download CSS
      </button>
      <button type="button" aria-label="Export PanelProvider icon config" @click="emit('exportIconPhp')">
        Export icon PHP
      </button>
      <button type="button" aria-label="Export panel branding JSON" @click="emit('exportBrandingJson')">
        Export branding JSON
      </button>
      <button type="button" aria-label="Export PanelProvider branding config" @click="emit('exportBrandingPhp')">
        Export branding PHP
      </button>
      <button type="button" aria-label="Undo" :disabled="!canUndo" @click="emit('undo')">Undo</button>
      <button type="button" aria-label="Redo" :disabled="!canRedo" @click="emit('redo')">Redo</button>
      <button type="button" aria-label="Inspector" :aria-pressed="inspectorEnabled" @click="emit('toggleInspector')">Inspector</button>
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
