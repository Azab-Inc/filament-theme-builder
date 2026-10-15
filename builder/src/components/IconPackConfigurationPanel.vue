<script setup lang="ts">
import type { IconPackName } from '../models/icons.model'
import type { IconPackConfigurationPanelEmits, IconPackConfigurationPanelProps } from './icon-pack-configuration-panel.model'

defineProps<IconPackConfigurationPanelProps>()
defineEmits<IconPackConfigurationPanelEmits>()
</script>

<template>
  <section v-show="active" id="editor-panel-icons" class="icons grid gap-4" role="tabpanel" tabindex="0" aria-labelledby="editor-tab-icons" data-editor-section="icons">
    <h2 id="icons-heading">Icons</h2>
    <p>Heroicons are runtime Filament configuration. Preview changes apply to rendered icons immediately.</p>
    <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
      <legend>IconPackConfiguration</legend>
      <label for="icon-pack">Icon pack</label>
      <select id="icon-pack" aria-label="Icon pack" :value="configuration.pack" @change="$emit('changePack', ($event.target as HTMLSelectElement).value as IconPackName)">
        <option v-for="pack in packNames" :key="pack" :value="pack">{{ pack }}</option>
      </select>
      <button type="button" aria-label="Reset icon configuration" @click="$emit('resetConfiguration')">Reset icon configuration</button>
      <div v-for="key in resourceKeys" :key="key" class="icon-control-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
        <label :for="`${key}-semantic-icon`">{{ key.charAt(0).toUpperCase() + key.slice(1) }} semantic icon override</label>
        <select :id="`${key}-semantic-icon`" :aria-label="`${key.charAt(0).toUpperCase() + key.slice(1)} semantic icon override`" :value="configuration.overrides[key] ?? ''" @change="$emit('changeOverride', { key, value: ($event.target as HTMLSelectElement).value })">
          <option value="">Inherited from pack ({{ previews[key] }})</option>
          <option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</option>
        </select>
        <span role="status">{{ previews[key] }}</span>
        <button type="button" :aria-label="`Reset ${key} semantic icon`" @click="$emit('resetOverride', key)">Reset</button>
      </div>
    </fieldset>
  </section>
</template>
