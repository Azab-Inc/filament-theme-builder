<script setup lang="ts">
import { reactive } from 'vue'
import FoundationsPaletteControls from '@/components/FoundationsPaletteControls.vue'
import FoundationsSurfaceControls from '@/components/FoundationsSurfaceControls.vue'
import FoundationsTypographyLayoutControls from '@/components/FoundationsTypographyLayoutControls.vue'
import type { BuilderShellModel } from '@/models/builder-shell.model'
const props = defineProps<{ shell: BuilderShellModel }>()
const shell = reactive(props.shell)
</script>

<template>
  <div class="foundations-panel">
    <h2 id="foundations-heading">Foundations</h2><p class="foundations__hint">Global values are persisted in the theme and projected only when the Filament 5.9 compatibility inventory supports them.</p>
    <FoundationsPaletteControls :active-mode="shell.activeMode" :palettes="shell.palettes" :palette-names="shell.paletteNames" :palette-shades="shell.paletteShades" :status-for="shell.statusFor" :context-key="`${shell.theme.activeThemeId}:${shell.selectedEditorSection}`" @set-palette-base="shell.setPaletteBase" @set-palette-shade="shell.setPaletteShade" @reset-palette-base="shell.resetPaletteBase" @reset-palette-shade="shell.resetPaletteShade" />
    <FoundationsSurfaceControls :active-mode="shell.activeMode" :surfaces="shell.rawFoundationColors.surfaces" :borders="shell.rawFoundationColors.borders" :text="shell.rawFoundationColors.text" :effective-foundation="shell.resolvedFoundation" :surface-names="shell.surfaceNames" :border-names="shell.borderNames" :text-names="shell.textNames" :status-for="shell.statusFor" :foundation-error="shell.foundationError" :context-key="`${shell.theme.activeThemeId}:${shell.selectedEditorSection}`" @set-mode-value="shell.setModeValue" @reset="shell.reset" />
    <FoundationsTypographyLayoutControls :typography="shell.foundation.typography" :spacing="shell.foundation.spacing" :density="shell.foundation.density" :radius="shell.foundation.radius" :border-width="shell.foundation.borderWidth" :shadow="shell.foundation.shadow" :font-choices="shell.fontChoices" :status-for="shell.statusFor" @set-font-choice="shell.setFontChoice($event.name, $event.event)" @set-font-name="shell.setFontName($event.name, $event.event)" @set-density="shell.setDensity" @set-number-foundation="shell.setNumberFoundation($event.path, $event.event)" @set-select-foundation="shell.setSelectFoundation($event.path, $event.event)" @reset="shell.reset" />
  </div>
</template>
