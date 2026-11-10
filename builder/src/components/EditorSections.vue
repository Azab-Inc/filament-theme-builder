<script setup lang="ts">
import { reactive } from 'vue'
import FoundationsPanel from '@/components/FoundationsPanel.vue'
import BrandingSettingsPanel from './BrandingSettingsPanel.vue'
import IconPackConfigurationPanel from './IconPackConfigurationPanel.vue'
import SemanticComponentControls from './SemanticComponentControls.vue'
import AdvancedRawInspector from './AdvancedRawInspector.vue'
import type { BuilderShellModel } from '@/models/builder-shell.model'

const props = defineProps<{ shell: BuilderShellModel }>()
const shell = reactive(props.shell)
</script>

<template>
  <section v-show="shell.selectedEditorSection === 'foundations'" id="editor-panel-foundations" class="foundations grid gap-4" role="tabpanel" tabindex="0" aria-labelledby="editor-tab-foundations" data-editor-section="foundations">
    <FoundationsPanel :shell="props.shell" />
  </section>
  <BrandingSettingsPanel :active="shell.selectedEditorSection === 'branding'" :branding="shell.theme.theme.branding" :upload-errors="shell.uploadErrors" @change-branding="shell.applyBrandingChange" @upload-asset="shell.uploadBrandingAsset($event.setting, $event.event)" @set-brand-typography="shell.setBrandTypography" @set-custom-brand-typography="shell.setCustomBrandTypography" @reset-branding="shell.theme.resetBranding" />
  <IconPackConfigurationPanel :active="shell.selectedEditorSection === 'icons'" :configuration="shell.theme.theme.icons" :pack-names="shell.iconPackNames" :resource-keys="shell.resourceIconKeys" :icon-options="shell.iconOptions" :previews="shell.iconPreviews" @change-pack="shell.setIconPack" @change-override="shell.setIconOverride($event.key, $event.value)" @reset-override="shell.theme.resetSemanticResourceIcon" @reset-configuration="shell.theme.resetIconConfiguration" />
  <SemanticComponentControls :key="`${shell.selectedEditorSection}:${shell.activeMode}`" v-show="shell.selectedEditorSection === 'components'" :active-theme-id="shell.theme.activeThemeId" :active-mode="shell.activeMode" :rows="shell.productNameRows" :padding-targets="shell.inspectorRegistry.entries.flatMap((entry) => entry.paddingTargets ?? [])" :padding-read="shell.theme.readPadding" :padding-set="shell.theme.setPadding" :padding-reset="shell.theme.resetPadding" @set-value="shell.setProductNameValue($event.row, $event.event)" @reset="shell.resetProductNameValue($event.row)" />
  <AdvancedRawInspector :evidence="shell.inspector.selectedInspectorEvidence" :visible="Boolean(shell.inspector.selectedInspectorEvidence && shell.selectedEditorSection === 'inspector')" :active-theme-id="shell.theme.activeThemeId" :active-mode="shell.activeMode" :selector="shell.rawSelector" :state="shell.rawInspectorState" :selector-error="shell.rawSelectorError" :selector-classification="shell.rawSelectorClassification" :properties="shell.rawProperties" :property-value="(property) => shell.rawPropertyValue(property, shell.activeMode)" @choose-target="shell.chooseRawTarget" @set-selector="shell.setRawSelector" @set-state="shell.setRawInspectorState" @set-property="shell.setRawProperty" @reset-property="shell.resetRawProperty" @reset-override="shell.resetRawOverride" />
</template>
