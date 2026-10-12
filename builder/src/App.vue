<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import { storeToRefs } from 'pinia'

import type {
  Density,
  FontChoice,
  PaletteName,
  PaletteShade,
  ThemeMode,
} from '@/models/foundations.model'
import { CURATED_FONT_CHOICES, PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/services/foundation-defaults'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'
import { useThemeStore } from '@/stores/theme'
import ThrowawayThemePrototype from '@/components/ThrowawayThemePrototype.vue'

const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
const prototypePreviewUrl = import.meta.env.VITE_DEMO_URL ?? 'http://127.0.0.1:4174/demo/admin'
const prototypeMode = new URLSearchParams(window.location.search).get('prototype') === '1'
const prototypeVariant = new URLSearchParams(window.location.search).get('variant') ?? 'A'
const theme = useThemeStore()
const iframe = ref<HTMLIFrameElement>()
const { canUndo, canRedo } = storeToRefs(theme)
const paletteNames = PALETTE_NAMES
const paletteShades = PALETTE_SHADES
const activeMode = ref<ThemeMode>('light')
const surfaceNames = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
const typographyNames = ['body', 'heading', 'mono'] as const
const borderNames = ['default', 'strong'] as const
const textNames = ['primary', 'muted', 'disabled'] as const
const radiusOptions = ['none', 'sm', 'md', 'lg', 'xl', 'full'] as const
const shadowOptions = ['none', 'sm', 'md', 'lg', 'xl'] as const
const fontChoices: ReadonlyArray<{ value: string; label: string; font?: FontChoice }> = [
  {
    value: 'system',
    label: 'System',
    font: { kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' },
  },
  {
    value: 'system-mono',
    label: 'System Mono',
    font: {
      kind: 'system',
      name: 'System Mono',
      family:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },
  ...CURATED_FONT_CHOICES.map((font) => ({
    value: `curated:${font.name}`,
    label: font.name,
    font: { kind: 'curated' as const, ...font },
  })),
  { value: 'custom', label: 'Custom family' },
]
const defaultFoundation = createDefaultFoundationState()
const foundation = computed(() => theme.theme.foundations)
const resolvedFoundation = computed(() => theme.resolveFoundation(activeMode.value))
const spacingNames = computed(() => Object.keys(foundation.value.spacing))
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

watch(activeMode, postTheme)

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

function resetPaletteBase(name: PaletteName): void {
  reset(`palettes.${name}.base`)
}

function shadeValue(name: PaletteName, shade: PaletteShade): string {
  return foundation.value.palettes[name].overrides[shade] ?? ''
}

function setPaletteShade(name: PaletteName, shade: PaletteShade, event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (value) theme.setPaletteShadeOverride(name, shade, value)
}

function paletteStatus(name: PaletteName, shade: PaletteShade): string {
  return statusFor(`palettes.${name}.shades.${shade}`)
}

function setMode(mode: ThemeMode): void {
  activeMode.value = mode
}

function statusFor(path: string): string {
  const inventory = lookupFoundationMapping(mappingIdFor(path))
  if (!inventory) return 'unmapped'
  if (inventory.mapping !== 'preview-emulatable') return inventory.mapping

  const provenancePath = /^(surfaces|borders|text)\./.test(path)
    ? `${path}.${activeMode.value}`
    : path
  const paletteShade = /^palettes\.([^.]+)\.shades\.(\d+)$/.exec(path)
  if (paletteShade) {
    const palette = foundation.value.palettes[paletteShade[1] as PaletteName]
    return palette?.overrides[Number(paletteShade[2]) as PaletteShade] ? 'explicit' : 'generated'
  }
  const current = getPath(foundation.value, provenancePath)
  const defaultValue = getPath(defaultFoundation, provenancePath)
  return JSON.stringify(current) === JSON.stringify(defaultValue) ? 'inherited' : 'explicit'
}

function mappingIdFor(path: string): string {
  const palette = /^palettes\.([^.]+)\.(base|shades)(?:\.(\d+))?$/.exec(path)
  if (palette) return `palette.${palette[1]}.${palette[2]}${palette[3] ? `.${palette[3]}` : ''}`
  const mode = /^(surfaces|borders|text)\.([^.]+)$/.exec(path)
  if (mode) return `${mode[1] === 'surfaces' ? 'surface' : mode[1] === 'borders' ? 'border' : 'text'}.${mode[2]}`
  return path
}

function getPath(root: Record<string, unknown>, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (value, key) =>
        value !== null && typeof value === 'object' && key in value
          ? (value as Record<string, unknown>)[key]
          : undefined,
      root,
    )
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

function fontSelection(name: 'body' | 'heading' | 'mono'): string {
  const font = foundation.value.typography[name]
  if (font.kind === 'custom') return 'custom'
  if (font.kind === 'curated') return `curated:${font.name}`
  return font.name === 'System Mono' ? 'system-mono' : 'system'
}

function setFontChoice(name: 'body' | 'heading' | 'mono', event: Event): void {
  const selection = (event.target as HTMLSelectElement).value
  const choice = fontChoices.find((font) => font.value === selection)
  if (choice?.font) theme.setFoundation(`typography.${name}`, choice.font)
}

function setModeValue(path: string, event: Event): void {
  theme.setFoundation(`${path}.${activeMode.value}`, (event.target as HTMLInputElement).value)
}

function fontName(name: 'body' | 'heading' | 'mono'): string {
  return foundation.value.typography[name].name
}

function reset(path: string): void {
  theme.resetFoundation(path)
}
</script>

<template>
  <ThrowawayThemePrototype
    v-if="prototypeMode"
    :initial-variant="prototypeVariant"
    :preview-url="prototypePreviewUrl"
  />
  <main v-else class="preview-shell">
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
    <section class="foundations grid gap-4" aria-labelledby="foundations-heading">
      <h2 id="foundations-heading">Foundations</h2>
      <p class="foundations__hint">
        Global values are persisted in the theme and projected only when the Filament 5.9
        compatibility inventory supports them.
      </p>

      <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
        <legend>Color palettes</legend>
        <div v-for="name in paletteNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label :for="`${name}-palette-base`">{{ name }} palette base</label>
          <input
            :id="`${name}-palette-base`"
            type="text"
            :value="foundation.palettes[name].base"
            @input="setPaletteBase(name, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`palettes.${name}.base`) }}</span>
          <button
            type="button"
            :aria-label="`Reset ${name} palette base`"
            @click="resetPaletteBase(name)"
          >
            Reset
          </button>
          <template v-for="shade in paletteShades" :key="`${name}-${shade}`">
            <label :for="`${name}-shade-${shade}`">{{ name }} shade {{ shade }} override</label>
            <input
              :id="`${name}-shade-${shade}`"
              type="text"
              :aria-label="`${name} shade ${shade} override`"
              :value="shadeValue(name, shade)"
              @input="setPaletteShade(name, shade, $event)"
            />
            <span role="status" aria-live="polite">{{ paletteStatus(name, shade) }}</span>
            <button
              type="button"
              :aria-label="`Reset ${name} shade ${shade}`"
              @click="theme.resetPaletteShade(name, shade)"
            >
              Reset
            </button>
          </template>
        </div>
      </fieldset>

      <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
        <legend>Surfaces, borders, text, and modes</legend>
        <div role="group" aria-label="Preview mode">
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
        <div v-for="name in surfaceNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label :for="`${name}-surface`">{{ name }} surface {{ activeMode }}</label>
          <input
            :id="`${name}-surface`"
            type="text"
            :value="resolvedFoundation.surfaces[name]"
            @input="setModeValue(`surfaces.${name}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`surfaces.${name}`) }}</span>
          <button
            type="button"
            :aria-label="`Reset ${name} surface`"
            @click="reset(`surfaces.${name}.${activeMode}`)"
          >
            Reset
          </button>
        </div>
        <div v-for="name in borderNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label :for="`border-${name}-${activeMode}`">border {{ name }} {{ activeMode }}</label>
          <input
            :id="`border-${name}-${activeMode}`"
            type="text"
            :aria-label="`Border ${name} ${activeMode}`"
            :value="resolvedFoundation.borders[name]"
            @input="setModeValue(`borders.${name}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`borders.${name}`) }}</span>
          <button
            type="button"
            :aria-label="`Reset border ${name} ${activeMode}`"
            @click="reset(`borders.${name}.${activeMode}`)"
          >
            Reset
          </button>
        </div>
        <div v-for="name in textNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label :for="`text-${name}-${activeMode}`">text {{ name }} {{ activeMode }}</label>
          <input
            :id="`text-${name}-${activeMode}`"
            type="text"
            :aria-label="`Text ${name} ${activeMode}`"
            :value="resolvedFoundation.text[name]"
            @input="setModeValue(`text.${name}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`text.${name}`) }}</span>
          <button
            type="button"
            :aria-label="`Reset text ${name} ${activeMode}`"
            @click="reset(`text.${name}.${activeMode}`)"
          >
            Reset
          </button>
        </div>
      </fieldset>

      <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
        <legend>Typography</legend>
        <div v-for="name in typographyNames" :key="name" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label :for="`${name}-font-kind`">{{ name }} font type</label>
          <select
            :id="`${name}-font-kind`"
            :aria-label="`${name} font type`"
            :value="fontSelection(name)"
            @change="setFontChoice(name, $event)"
          >
            <option v-for="choice in fontChoices" :key="choice.value" :value="choice.value">
              {{ choice.label }}
            </option>
          </select>
          <span role="status" aria-live="polite">{{ statusFor(`typography.${name}`) }}</span>
          <button
            type="button"
            :aria-label="`Reset ${name} font`"
            @click="reset(`typography.${name}`)"
          >
            Reset
          </button>
          <label :for="`${name}-font-name`">{{ name }} font name</label>
          <input
            :id="`${name}-font-name`"
            type="text"
            :aria-label="`${name} font name`"
            :value="fontName(name)"
            @input="setFontName(name, $event)"
          />
        </div>
        <p>Font names are stored only; the builder never loads or hosts font files.</p>
      </fieldset>

      <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
        <legend>Layout foundations</legend>
        <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label for="density">Density</label>
          <select
            id="density"
            :value="foundation.density"
            @change="setDensity(($event.target as HTMLSelectElement).value as Density)"
          >
            <option value="compact">Compact</option>
            <option value="default">Default</option>
            <option value="spacious">Spacious</option>
          </select>
          <span role="status" aria-live="polite">{{ statusFor('density') }}</span>
          <button type="button" aria-label="Reset density" @click="reset('density')">Reset</button>
        </div>
        <div role="group" aria-label="Density presets">
          <button type="button" aria-label="Compact density" @click="setDensity('compact')">
            Compact
          </button>
          <button type="button" aria-label="Default density" @click="setDensity('default')">
            Default
          </button>
          <button type="button" aria-label="Spacious density" @click="setDensity('spacious')">
            Spacious
          </button>
        </div>
        <div v-for="key in spacingNames" :key="key" class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label :for="`spacing-${key.replace('.', '-')}`">Spacing {{ key }}</label>
          <input
            :id="`spacing-${key.replace('.', '-')}`"
            type="number"
            min="0"
            max="256"
            :aria-label="`Spacing ${key}`"
            :value="foundation.spacing[key]"
            @input="setNumberFoundation(`spacing.${key}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`spacing.${key}`) }}</span>
          <button
            type="button"
            :aria-label="`Reset spacing ${key}`"
            @click="reset(`spacing.${key}`)"
          >
            Reset
          </button>
        </div>
        <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label for="radius">Radius</label>
          <select
            id="radius"
            :value="foundation.radius"
            @change="setSelectFoundation('radius', $event)"
          >
            <option v-for="value in radiusOptions" :key="value" :value="value">{{ value }}</option>
          </select>
          <span role="status" aria-live="polite">{{ statusFor('radius') }}</span>
          <button type="button" aria-label="Reset radius" @click="reset('radius')">Reset</button>
        </div>
        <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label for="border-width">Border width</label>
          <input
            id="border-width"
            type="number"
            min="0"
            max="8"
            :value="foundation.borderWidth"
            @input="setNumberFoundation('borderWidth', $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor('borderWidth') }}</span>
          <button type="button" aria-label="Reset border width" @click="reset('borderWidth')">
            Reset
          </button>
        </div>
        <div class="foundation-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]">
          <label for="shadow">Shadow</label>
          <select
            id="shadow"
            :value="foundation.shadow"
            @change="setSelectFoundation('shadow', $event)"
          >
            <option v-for="value in shadowOptions" :key="value" :value="value">{{ value }}</option>
          </select>
          <span role="status" aria-live="polite">{{ statusFor('shadow') }}</span>
          <button type="button" aria-label="Reset shadow" @click="reset('shadow')">Reset</button>
        </div>
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

<style>
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

.foundations > fieldset {
  display: grid;
  gap: 1rem;
  margin: 0;
  min-width: 0;
}

.foundation-row {
  align-items: center;
  display: grid;
  gap: 0.5rem;
  grid-template-columns: minmax(10rem, 1fr) minmax(12rem, 2fr) auto auto;
  min-width: 0;
}

@media (max-width: 767px) {
  .foundations {
    max-height: 50vh;
  }

  .foundation-row {
    grid-template-columns: 1fr;
  }
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
