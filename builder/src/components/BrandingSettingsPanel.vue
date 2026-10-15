<script setup lang="ts">
import type { PanelBrandingSettings } from '../models/panel-branding.model'
import type { BrandingSettingsPanelEmits, BrandingSettingsPanelProps } from './branding-settings-panel.model'

defineProps<BrandingSettingsPanelProps>()
defineEmits<BrandingSettingsPanelEmits>()
</script>

<template>
  <section v-show="active" id="editor-panel-branding" class="branding grid gap-4" role="tabpanel" tabindex="0" aria-labelledby="editor-tab-branding" data-editor-section="branding">
    <h2 id="branding-heading">Panel branding and runtime</h2>
    <p>CSS-previewable values apply immediately. PanelProvider values refresh the iframe without losing this draft.</p>
    <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
      <legend>PanelBrandingSettings</legend>
      <label for="brand-app-name">App name</label>
      <input id="brand-app-name" aria-label="App name" :value="branding.appName" @input="$emit('changeBranding', { setting: 'appName', value: ($event.target as HTMLInputElement).value })" />
      <label for="brand-light-logo">Light logo upload reference</label>
      <input id="brand-light-logo-file" aria-label="Upload light logo" type="file" accept="image/jpeg,image/png,image/webp" @change="$emit('uploadAsset', { setting: 'lightLogo', event: $event })" />
      <input id="brand-light-logo" aria-label="Light logo upload reference" :value="branding.lightLogo ?? ''" @input="$emit('changeBranding', { setting: 'lightLogo', value: ($event.target as HTMLInputElement).value || null })" />
      <span v-if="uploadErrors.lightLogo" role="alert">{{ uploadErrors.lightLogo }}</span>
      <label for="brand-dark-logo">Dark logo upload reference</label>
      <input id="brand-dark-logo-file" aria-label="Upload dark logo" type="file" accept="image/jpeg,image/png,image/webp" @change="$emit('uploadAsset', { setting: 'darkLogo', event: $event })" />
      <input id="brand-dark-logo" aria-label="Dark logo upload reference" :value="branding.darkLogo ?? ''" @input="$emit('changeBranding', { setting: 'darkLogo', value: ($event.target as HTMLInputElement).value || null })" />
      <span v-if="uploadErrors.darkLogo" role="alert">{{ uploadErrors.darkLogo }}</span>
      <label for="brand-favicon">Favicon upload reference</label>
      <input id="brand-favicon-file" aria-label="Upload favicon" type="file" accept="image/jpeg,image/png,image/webp" @change="$emit('uploadAsset', { setting: 'favicon', event: $event })" />
      <input id="brand-favicon" aria-label="Favicon upload reference" :value="branding.favicon ?? ''" @input="$emit('changeBranding', { setting: 'favicon', value: ($event.target as HTMLInputElement).value || null })" />
      <span v-if="uploadErrors.favicon" role="alert">{{ uploadErrors.favicon }}</span>
      <label for="brand-logo-height">Logo height (CSS-previewable)</label>
      <input id="brand-logo-height" aria-label="Logo height" :value="branding.logoHeight" @input="$emit('changeBranding', { setting: 'logoHeight', value: ($event.target as HTMLInputElement).value })" />
      <label for="brand-font">Brand typography</label>
      <select id="brand-font" aria-label="Brand typography" :value="branding.brandTypography.name" @change="$emit('setBrandTypography', $event)">
        <option value="System">System</option>
        <option value="Inter">Inter (Google Fonts)</option>
        <option value="Roboto">Roboto (Google Fonts)</option>
      </select>
      <label for="brand-custom-font">Custom Google Font family</label>
      <input id="brand-custom-font" aria-label="Custom Google Font family" :value="branding.brandTypography.kind === 'custom' ? branding.brandTypography.family : ''" placeholder="Example: Source Sans 3" @change="$emit('setCustomBrandTypography', $event)" />
      <label for="brand-content-width">Content width</label>
      <select id="brand-content-width" aria-label="Content width" :value="branding.contentWidth" @change="$emit('changeBranding', { setting: 'contentWidth', value: ($event.target as HTMLSelectElement).value as PanelBrandingSettings['contentWidth'] })">
        <option v-for="value in ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']" :key="value" :value="value">{{ value }}</option>
      </select>
      <label for="brand-sidebar">Sidebar behavior</label>
      <select id="brand-sidebar" aria-label="Sidebar behavior" :value="branding.sidebar" @change="$emit('changeBranding', { setting: 'sidebar', value: ($event.target as HTMLSelectElement).value as PanelBrandingSettings['sidebar'] })">
        <option value="collapsible">Collapsible</option>
        <option value="fully-collapsible">Fully collapsible</option>
        <option value="top-navigation">Top navigation</option>
      </select>
      <button type="button" aria-label="Reset panel branding" @click="$emit('resetBranding')">Reset panel branding</button>
    </fieldset>
  </section>
</template>
