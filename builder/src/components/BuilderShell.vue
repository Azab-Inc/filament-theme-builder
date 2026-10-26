<script setup lang="ts">
import { reactive } from 'vue'
import EditorToolbar from '@/components/EditorToolbar.vue'
import PreviewFrame from '@/components/PreviewFrame.vue'
import EditorWorkspace from '@/components/EditorWorkspace.vue'
import { useBuilderShell } from '@/composables/use-builder-shell'

const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
const model = useBuilderShell(previewUrl)
const shell = reactive(model)
</script>

<template>
  <main class="preview-shell">
    <a class="sr-only focus:not-sr-only" href="#builder-editor-panel">Skip to theme editor</a>
    <EditorToolbar
      :primary-color="shell.primaryColor"
      :can-undo="shell.canUndo"
      :can-redo="shell.canRedo"
      :inspector-enabled="shell.inspector.inspectorEnabled"
      :inspector-status="!shell.inspector.inspectorEnabled ? 'Inspector disabled' : shell.inspector.inspectorResolution ? shell.inspector.inspectorResolution.breadcrumb : 'Inspector enabled'"
      :export-status="shell.exportStatus"
      :runtime-loading="shell.preview.runtimeLoading"
      :legacy-recovery-available="shell.theme.legacyRecoveryAvailable"
      :legacy-recovery-error="shell.theme.legacyRecoveryError"
      :themes="shell.theme.themes"
      :active-theme-id="shell.theme.activeThemeId"
      :active-mode="shell.activeMode"
      :storage-error="shell.theme.storageError"
      @update:primary-color="shell.primaryColor = $event"
      @set-mode="shell.setMode"
      @export-canonical-json="shell.exportCanonicalJson"
      @copy-vanilla-theme-css="shell.copyVanillaThemeCss"
      @export-vanilla-theme-css="shell.exportVanillaThemeCss"
      @export-icon-php="shell.exportIconPhp"
      @export-branding-json="shell.exportBrandingJson"
      @export-branding-php="shell.exportBrandingPhp"
      @undo="shell.undo"
      @redo="shell.redo"
      @toggle-inspector="shell.inspector.toggleInspector"
      @restore-legacy-recovery="shell.restoreLegacyRecovery"
      @download-legacy-recovery="shell.downloadLegacyRecovery"
      @save="shell.theme.saveTheme"
      @create="shell.theme.createTheme"
      @open="shell.theme.openTheme"
      @rename="shell.theme.renameTheme"
      @duplicate="shell.theme.duplicateTheme"
      @delete="shell.theme.deleteTheme"
    />
    <PreviewFrame :iframe-src="shell.preview.iframeSrc" :set-iframe="shell.setPreviewIframe" :on-preview-load="shell.preview.onPreviewLoad">
      <EditorWorkspace :shell="model" />
    </PreviewFrame>
  </main>
</template>
