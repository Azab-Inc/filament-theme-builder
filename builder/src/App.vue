<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import { storeToRefs } from 'pinia'

import type { Density, PaletteName, PaletteShade, ThemeMode } from '@/models/foundations.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { useThemeStore } from '@/stores/theme'

const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
const theme = useThemeStore()
const iframe = ref<HTMLIFrameElement>()
const { canUndo, canRedo } = storeToRefs(theme)
const paletteNames = PALETTE_NAMES
const paletteShades = PALETTE_SHADES
const activeMode = ref<ThemeMode>('light')
const surfaceNames = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
const typographyNames = ['body', 'heading', 'mono'] as const
const radiusOptions = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const shadowOptions = ['none', 'sm', 'md', 'lg', 'xl'] as const
const foundation = computed(() => theme.theme.foundations)
const resolvedFoundation = computed(() => theme.resolveFoundation(activeMode.value))
const primaryColor = computed({
  get: () => theme.theme.colors.primary,
  set: (color: string) => theme.setPrimaryColor(color),
})

function postTheme(): void {
  const target = iframe.value?.contentWindow
  if (!target) return
  const targetOrigin = new URL(previewUrl, window.location.href).origin
  target.postMessage(
    {
      type: 'ftb:theme:update',
      schemaVersion: 1,
      theme: structuredClone(JSON.parse(JSON.stringify(toRaw(theme.theme)))),
      projection: theme.previewFoundation(activeMode.value),
    },
    targetOrigin,
  )
}

function handleKeydown(event: KeyboardEvent): void {
  if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return
  const target = event.target
  if (target instanceof HTMLInputElement && target.type !== 'color') return
  event.preventDefault()
  if (event.shiftKey) theme.redo()
  else theme.undo()
}

watch(
  () => theme.theme,
  () => {
    postTheme()
  },
  { deep: true },
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  postTheme()
})

onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))

function undo(): void {
  theme.undo()
}

function redo(): void {
  theme.redo()
}

function setPaletteBase(name: PaletteName, event: Event): void {
  theme.setPaletteBase(name, (event.target as HTMLInputElement).value)
}

function shadeValue(name: PaletteName, shade: PaletteShade): string {
  return foundation.value.palettes[name].overrides[shade] ?? ''
}

function setPaletteShade(name: PaletteName, shade: PaletteShade, event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (value) theme.setPaletteShadeOverride(name, shade, value)
}

function paletteStatus(name: PaletteName, shade: PaletteShade): 'generated' | 'explicit' {
  return foundation.value.palettes[name].overrides[shade] ? 'explicit' : 'generated'
}

function setMode(mode: ThemeMode): void {
  activeMode.value = mode
}

function setDensity(value: Density): void {
  theme.setDensity(value)
}

function setSelectFoundation(path: string, event: Event): void {
  theme.setFoundation(path, (event.target as HTMLSelectElement).value)
}

function setNumberFoundation(path: string, event: Event): void {
  theme.setFoundation(path, Number((event.target as HTMLInputElement).value))
}

function setFontName(name: 'body' | 'heading' | 'mono', event: Event): void {
  const value = (event.target as HTMLInputElement).value.trim()
  if (!value) return
  theme.setFoundation(`typography.${name}`, { kind: 'custom', name: value, family: value })
}

function fontName(name: 'body' | 'heading' | 'mono'): string {
  return foundation.value.typography[name].name
}

function reset(path: string): void {
  theme.resetFoundation(path)
}
</script>

<template>
  <main class="preview-shell">
    <header class="preview-shell__header">
      <h1>Filament Theme Builder</h1>
      <p data-demo-notice>Preview demo data is temporary.</p>
      <label
        >Primary color
        <input v-model="primaryColor" type="color" aria-label="Primary color" />
      </label>
      <button type="button" aria-label="Undo" :disabled="!canUndo" @click="undo">Undo</button>
      <button type="button" aria-label="Redo" :disabled="!canRedo" @click="redo">Redo</button>
    </header>
    <section class="foundations" aria-labelledby="foundations-heading">
      <h2 id="foundations-heading">Foundations</h2>
      <p class="foundations__hint">
        Global values are persisted in the theme and projected only when the Filament 5.9
        compatibility inventory supports them.
      </p>

      <fieldset>
        <legend>Color palettes</legend>
        <div v-for="name in paletteNames" :key="name" class="foundation-control">
          <label :for="`${name}-palette-base`">{{ name }} palette base</label>
          <input
            :id="`${name}-palette-base`"
            type="text"
            :value="foundation.palettes[name].base"
            @input="setPaletteBase(name, $event)"
          />
          <span class="foundation-status">generated</span>
          <label
            v-for="shade in paletteShades"
            :key="`${name}-${shade}`"
            :for="`${name}-shade-${shade}`"
            >{{ name }} shade {{ shade }} override
            <input
              :id="`${name}-shade-${shade}`"
              type="text"
              :aria-label="`${name} shade ${shade} override`"
              :value="shadeValue(name, shade)"
              @input="setPaletteShade(name, shade, $event)"
            />
            <span class="foundation-status">{{ paletteStatus(name, shade) }}</span>
            <button
              type="button"
              :aria-label="`Reset ${name} shade ${shade}`"
              @click="theme.resetPaletteShade(name, shade)"
            >
              Reset
            </button>
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend>Surfaces and modes</legend>
        <div class="foundation-mode" role="group" aria-label="Preview mode">
          <button
            type="button"
            aria-label="Light mode"
            :aria-pressed="activeMode === 'light'"
            @click="setMode('light')"
          >
            Light
          </button>
          <button
            type="button"
            aria-label="Dark mode"
            :aria-pressed="activeMode === 'dark'"
            @click="setMode('dark')"
          >
            Dark
          </button>
        </div>
        <label v-for="name in surfaceNames" :key="name" :for="`${name}-surface`"
          >{{ name }} surface ({{ activeMode }})
          <input
            :id="`${name}-surface`"
            type="text"
            :value="resolvedFoundation.surfaces[name]"
            @input="
              theme.setFoundation(
                `surfaces.${name}.${activeMode}`,
                ($event.target as HTMLInputElement).value,
              )
            "
          />
          <span class="foundation-status">inherited</span>
          <button
            type="button"
            :aria-label="`Reset ${name} surface`"
            @click="reset(`surfaces.${name}.${activeMode}`)"
          >
            Reset
          </button>
        </label>
        <p class="foundation-status">unmapped: disabled text remains an export/runtime concern.</p>
      </fieldset>

      <fieldset>
        <legend>Typography</legend>
        <label v-for="name in typographyNames" :key="name" :for="`${name}-font-name`"
          >{{ name }} font name
          <input
            :id="`${name}-font-name`"
            type="text"
            :aria-label="`${name} font name`"
            :value="fontName(name)"
            @input="setFontName(name, $event)"
          />
          <span class="foundation-status">inherited</span>
          <button
            type="button"
            :aria-label="`Reset ${name} font`"
            @click="reset(`typography.${name}`)"
          >
            Reset
          </button>
        </label>
        <p class="foundations__hint">
          Font names are stored only; the builder never loads or hosts font files.
        </p>
      </fieldset>

      <fieldset>
        <legend>Layout foundations</legend>
        <label for="density"
          >Density
          <select
            id="density"
            :value="foundation.density"
            @change="setDensity(($event.target as HTMLSelectElement).value as Density)"
          >
            <option value="compact">Compact</option>
            <option value="default">Default</option>
            <option value="spacious">Spacious</option>
          </select>
        </label>
        <button type="button" aria-label="Compact density" @click="setDensity('compact')">
          Compact
        </button>
        <button type="button" aria-label="Default density" @click="setDensity('default')">
          Default
        </button>
        <button type="button" aria-label="Spacious density" @click="setDensity('spacious')">
          Spacious
        </button>
        <span class="foundation-status">compatibility: runtime-refresh-required</span>
        <label for="radius"
          >Radius
          <select
            id="radius"
            :value="foundation.radius"
            @change="setSelectFoundation('radius', $event)"
          >
            <option v-for="value in radiusOptions" :key="value" :value="value">{{ value }}</option>
          </select>
          <button type="button" aria-label="Reset radius" @click="reset('radius')">Reset</button>
        </label>
        <label for="border-width"
          >Border width
          <input
            id="border-width"
            type="number"
            min="0"
            max="8"
            :value="foundation.borderWidth"
            @input="setNumberFoundation('borderWidth', $event)"
          />
          <button type="button" aria-label="Reset border width" @click="reset('borderWidth')">
            Reset
          </button>
        </label>
        <label for="shadow"
          >Shadow
          <select
            id="shadow"
            :value="foundation.shadow"
            @change="setSelectFoundation('shadow', $event)"
          >
            <option v-for="value in shadowOptions" :key="value" :value="value">{{ value }}</option>
          </select>
          <button type="button" aria-label="Reset shadow" @click="reset('shadow')">Reset</button>
        </label>
      </fieldset>
    </section>
    <iframe
      ref="iframe"
      :src="previewUrl"
      title="Filament preview"
      class="preview-shell__frame"
      @load="postTheme"
    />
  </main>
</template>

<style scoped>
.preview-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.foundations {
  max-height: 45vh;
  overflow: auto;
  padding: 0 1rem 1rem;
}

.foundations fieldset {
  display: grid;
  gap: 0.5rem;
  margin: 0 0 0.75rem;
  border: 1px solid #e4e4e7;
  padding: 0.75rem;
}

.foundations label,
.foundation-control {
  display: grid;
  grid-template-columns: minmax(8rem, 1fr) minmax(8rem, 1fr) auto auto;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
}

.foundation-control {
  display: contents;
}

.foundation-status {
  color: #71717a;
  font-size: 0.7rem;
  text-transform: lowercase;
}

.foundations__hint {
  color: #71717a;
  font-size: 0.75rem;
}

.preview-shell__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
}

.preview-shell__header h1 {
  margin: 0;
  font-size: 1rem;
}

.preview-shell__header p {
  margin: 0;
  color: #71717a;
  font-size: 0.75rem;
}

.preview-shell__frame {
  width: 100%;
  flex: 1;
  border: 0;
}
</style>
