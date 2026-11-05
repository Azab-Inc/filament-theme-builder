<script setup lang="ts">
import { computed } from 'vue'
import type { PanelBrandingSettings } from '../models/panel-branding.model'
import type { BrandingSettingsPanelEmits, BrandingSettingsPanelProps } from './branding-settings-panel.model'
import BrandingAssetField from './BrandingAssetField.vue'

const props = defineProps<BrandingSettingsPanelProps>()
const emit = defineEmits<BrandingSettingsPanelEmits>()
const assetFields = computed(() => [
  { setting: 'lightLogo', label: 'Light logo', value: props.branding.lightLogo, error: props.uploadErrors.lightLogo },
  { setting: 'darkLogo', label: 'Dark logo', value: props.branding.darkLogo, error: props.uploadErrors.darkLogo },
  { setting: 'favicon', label: 'Favicon', value: props.branding.favicon, error: props.uploadErrors.favicon },
] as const)
</script>

<template>
  <section v-show="active" id="editor-panel-branding" class="branding grid gap-4" role="tabpanel" tabindex="0" aria-labelledby="editor-tab-branding" data-editor-section="branding">
    <h2 id="branding-heading">Panel branding and runtime</h2>
    <p>CSS-previewable values apply immediately. PanelProvider values refresh the iframe without losing this draft.</p>
    <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
      <legend>PanelBrandingSettings</legend>
      <label for="brand-app-name">App name</label>
      <input id="brand-app-name" name="brand-app-name" autocomplete="off" aria-label="App name" :value="branding.appName" @input="$emit('changeBranding', { setting: 'appName', value: ($event.target as HTMLInputElement).value })" />
       <BrandingAssetField v-for="field in assetFields" :key="field.setting" v-bind="field" @update="emit('changeBranding', $event)" @upload="emit('uploadAsset', $event)" />
      <label for="brand-logo-height">Logo height (CSS-previewable)</label>
      <input id="brand-logo-height" name="brand-logo-height" autocomplete="off" aria-label="Logo height" :value="branding.logoHeight" @input="$emit('changeBranding', { setting: 'logoHeight', value: ($event.target as HTMLInputElement).value })" />
      <label for="brand-font">Brand typography</label>
      <select id="brand-font" name="brand-font" autocomplete="off" aria-label="Brand typography" :value="branding.brandTypography.name" @change="$emit('setBrandTypography', $event)">
        <option value="System">System</option>
        <option value="Inter">Inter (Google Fonts)</option>
        <option value="Roboto">Roboto (Google Fonts)</option>
      </select>
      <label for="brand-custom-font">Custom Google Font family</label>
      <input id="brand-custom-font" name="brand-custom-font" autocomplete="off" spellcheck="false" aria-label="Custom Google Font family" :value="branding.brandTypography.kind === 'custom' ? branding.brandTypography.family : ''" placeholder="Example: Source Sans 3" @change="$emit('setCustomBrandTypography', $event)" />
      <label for="brand-content-width">Content width</label>
      <select id="brand-content-width" name="brand-content-width" autocomplete="off" aria-label="Content width" :value="branding.contentWidth" @change="$emit('changeBranding', { setting: 'contentWidth', value: ($event.target as HTMLSelectElement).value as PanelBrandingSettings['contentWidth'] })">
        <option v-for="value in ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']" :key="value" :value="value">{{ value }}</option>
      </select>
      <label for="brand-sidebar">Sidebar behavior</label>
      <select id="brand-sidebar" name="brand-sidebar" autocomplete="off" aria-label="Sidebar behavior" :value="branding.sidebar" @change="$emit('changeBranding', { setting: 'sidebar', value: ($event.target as HTMLSelectElement).value as PanelBrandingSettings['sidebar'] })">
        <option value="collapsible">Collapsible</option>
        <option value="fully-collapsible">Fully collapsible</option>
        <option value="top-navigation">Top navigation</option>
      </select>
      <button type="button" aria-label="Reset panel branding" @click="$emit('resetBranding')">Reset panel branding</button>
    </fieldset>
  </section>
</template>
