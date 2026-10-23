<script setup lang="ts">
import { reactive } from 'vue'
import FoundationsPaletteControls from './FoundationsPaletteControls.vue'
import FoundationsSurfaceControls from './FoundationsSurfaceControls.vue'
import FoundationsTypographyLayoutControls from './FoundationsTypographyLayoutControls.vue'
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
    <h2 id="foundations-heading">Foundations</h2><p class="foundations__hint">Global values are persisted in the theme and projected only when the Filament 5.9 compatibility inventory supports them.</p>
    <FoundationsPaletteControls :palettes="shell.foundation.palettes" :palette-names="shell.paletteNames" :palette-shades="shell.paletteShades" :status-for="shell.statusFor" :context-key="`${shell.theme.activeThemeId}:${shell.selectedEditorSection}`" @set-palette-base="shell.setPaletteBase" @set-palette-shade="shell.setPaletteShade" @reset-palette-base="shell.resetPaletteBase" @reset-palette-shade="shell.resetPaletteShade" />
    <FoundationsSurfaceControls :active-mode="shell.activeMode" :surfaces="shell.resolvedFoundation.surfaces" :borders="shell.resolvedFoundation.borders" :text="shell.resolvedFoundation.text" :surface-names="shell.surfaceNames" :border-names="shell.borderNames" :text-names="shell.textNames" :status-for="shell.statusFor" :foundation-error="shell.foundationError" :context-key="`${shell.theme.activeThemeId}:${shell.selectedEditorSection}`" @set-mode="shell.setMode" @set-mode-value="shell.setModeValue" @reset="shell.reset" />
    <FoundationsTypographyLayoutControls :typography="shell.foundation.typography" :spacing="shell.foundation.spacing" :density="shell.foundation.density" :radius="shell.foundation.radius" :border-width="shell.foundation.borderWidth" :shadow="shell.foundation.shadow" :font-choices="shell.fontChoices" :status-for="shell.statusFor" @set-font-choice="shell.setFontChoice($event.name, $event.event)" @set-font-name="shell.setFontName($event.name, $event.event)" @set-density="shell.setDensity" @set-number-foundation="shell.setNumberFoundation($event.path, $event.event)" @set-select-foundation="shell.setSelectFoundation($event.path, $event.event)" @reset="shell.reset" />
  </section>
  <BrandingSettingsPanel :active="shell.selectedEditorSection === 'branding'" :branding="shell.theme.theme.branding" :upload-errors="shell.uploadErrors" @change-branding="shell.applyBrandingChange" @upload-asset="shell.uploadBrandingAsset($event.setting, $event.event)" @set-brand-typography="shell.setBrandTypography" @set-custom-brand-typography="shell.setCustomBrandTypography" @reset-branding="shell.theme.resetBranding" />
  <IconPackConfigurationPanel :active="shell.selectedEditorSection === 'icons'" :configuration="shell.theme.theme.icons" :pack-names="shell.iconPackNames" :resource-keys="shell.resourceIconKeys" :icon-options="shell.iconOptions" :previews="shell.iconPreviews" @change-pack="shell.setIconPack" @change-override="shell.setIconOverride($event.key, $event.value)" @reset-override="shell.theme.resetSemanticResourceIcon" @reset-configuration="shell.theme.resetIconConfiguration" />
     <SemanticComponentControls :key="shell.selectedEditorSection" v-show="shell.selectedEditorSection === 'components'" :active-theme-id="shell.theme.activeThemeId" :rows="shell.productNameRows" :padding-targets="shell.inspectorRegistry.entries.flatMap((entry) => entry.paddingTargets ?? [])" :padding-read="shell.theme.readPadding" :padding-set="shell.theme.setPadding" :padding-reset="shell.theme.resetPadding" @set-value="shell.setProductNameValue($event.row, $event.event)" @reset="shell.resetProductNameValue($event.row)" />
    <AdvancedRawInspector :visible="Boolean(shell.inspector.selectedInspectorEvidence && shell.selectedEditorSection === 'inspector')" :active-theme-id="shell.theme.activeThemeId" :selector="shell.rawSelector" :selector-error="shell.rawSelectorError" :selector-classification="shell.rawSelectorClassification" :properties="shell.rawProperties" :property-value="shell.rawPropertyValue" @set-selector="shell.setRawSelector" @set-property="shell.setRawProperty" @reset-property="shell.resetRawProperty" @reset-override="shell.resetRawOverride" />
</template>
