<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import type { ColorChoicePrototypeHost } from '@/models/color-choice-prototype.model'
import { useColorChoicePrototype } from '@/composables/use-color-choice-prototype'
import ColorChoicePrototypeSwitcher from '@/components/ColorChoicePrototypeSwitcher.vue'
import ColorChoicePrototypeNavigation from '@/components/ColorChoicePrototypeNavigation.vue'
import ColorChoicePrototypePreview from '@/components/ColorChoicePrototypePreview.vue'
import ColorChoicePrototypeEditor from '@/components/ColorChoicePrototypeEditor.vue'
import '@/styles/color-choice-prototype-shell.css'
import '@/styles/color-choice-prototype-layout.css'
import '@/styles/color-choice-prototype-preview.css'
import '@/styles/color-choice-prototype-preview-content.css'
import '@/styles/color-choice-prototype-panels.css'
import '@/styles/color-choice-prototype-palette-summary.css'
import '@/styles/color-choice-prototype-fields.css'
import '@/styles/color-choice-prototype-palette.css'
import '@/styles/color-choice-prototype-chooser.css'
import '@/styles/color-choice-prototype-custom.css'
import '@/styles/color-choice-prototype-hosts.css'
import '@/styles/color-choice-prototype-responsive-shell.css'
import '@/styles/color-choice-prototype-responsive-chooser.css'
import '@/styles/color-choice-prototype-switcher.css'
const state = useColorChoicePrototype()
function readVariant(): ColorChoicePrototypeHost {
  const requested = new URLSearchParams(location.search).get('variant')
  return (['A', 'B', 'C'].includes(requested ?? '') ? requested : 'A') as ColorChoicePrototypeHost
}
const host = ref(readVariant())
const updateVariant = () => {
  state.close()
  host.value = readVariant()
}
onMounted(() => window.addEventListener('popstate', updateVariant))
onUnmounted(() => window.removeEventListener('popstate', updateVariant))
</script>

<template>
  <div
    class="ccp-root"
    :class="`ccp-host-${host.toLowerCase()}`"
    :style="{ '--ccp-topbar-accent': state.theme.foundations.palettes.primary.base }"
  >
    <header class="ccp-studio-header">
      <a href="/" class="ccp-brand"
        ><i>F</i
        ><span><b>Filament Theme Builder</b><small>Studio · local prototype</small></span></a
      >
      <div class="ccp-theme-name"><b>Untitled theme</b><small>Changes stay in memory</small></div>
      <div class="ccp-header-actions">
        <button disabled>Undo</button><button disabled>Redo</button><button disabled>Save</button
        ><button disabled>Export</button>
      </div>
      <span class="ccp-small-status"
        >{{ state.changedCount.value }} scratch changes · prototype only</span
      >
    </header>
    <div class="ccp-studio-layout">
      <ColorChoicePrototypeNavigation :state="state" /><ColorChoicePrototypeEditor
        :state="state"
        :host="host"
      /><ColorChoicePrototypePreview />
    </div>
    <ColorChoicePrototypeSwitcher :variant="host" />
  </div>
</template>
