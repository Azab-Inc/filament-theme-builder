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
import type { ResolveRequest, ThemeOverride, ThemeScope, ThemeStateV4 } from '@/models/theme.model'
import type { IconPackName, ResourceIconKey } from '@/models/icons.model'
import type { PanelBrandingSetting } from '@/models/panel-branding.model'
import { ICON_PACK_NAMES, RESOURCE_ICON_KEYS } from '@/models/icons.model'
import { ICON_PACK_PRESETS } from '@/registry/icon-registry'
import { CURATED_FONT_CHOICES, PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/services/foundation-defaults'
import { lookupFoundationMapping } from '@/registry/filament-foundation-inventory'
import { serializeCanonicalTheme } from '@/services/theme-serialization'
import { exportIconConfigurationPhp } from '@/services/icon-export'
import { exportPanelBrandingJson, exportPanelProviderBrandingPhp } from '@/services/panel-branding-export'
import { exportVanillaCss } from '@/services/vanilla-css-export'
import { ALL_RAW_VISUAL_PROPERTIES, type RawVisualProperty } from '@/models/raw-overrides.model'
import { classifyRawSelector, proposeRawSelector, validateRawSelector } from '@/services/raw-override-validation'
import { isExplicitPath } from '@/services/foundation-provenance'
import { validateFoundationColor } from '@/services/foundation-validation'
import { resolveInspectorTarget } from '@/registry/theme-registry'
import { createThemeRegistry } from '@/registry/theme-registry'
import { isInspectorEvent, INSPECTOR_PROTOCOL_VERSION, type InspectorCommand, type InspectorEvent, type InspectorResolution, type InspectorTargetEvidence } from '@/services/inspector-protocol'
import { useThemeStore } from '@/stores/theme'
import ThrowawayThemePrototype from '@/components/ThrowawayThemePrototype.vue'
import HoverInspectPrototype from '@/components/HoverInspectPrototype.vue'

const previewUrl = import.meta.env.VITE_DEMO_URL ?? '/demo/admin'
const prototypePreviewUrl = import.meta.env.VITE_DEMO_URL ?? 'http://127.0.0.1:4174/demo/admin'
const inspectMode = new URLSearchParams(window.location.search).get('inspect') === '1'
const inspectVariant = new URLSearchParams(window.location.search).get('variant') ?? 'A'
const prototypeMode = new URLSearchParams(window.location.search).get('prototype') === '1'
const prototypeVariant = new URLSearchParams(window.location.search).get('variant') ?? 'A'
const theme = useThemeStore()
const iframe = ref<HTMLIFrameElement>()
const iframeSrc = ref(previewUrl)
const inspectorEnabled = ref(false)
const inspectorResolution = ref<InspectorResolution | null>(null)
const selectedInspectorEvidence = ref<InspectorTargetEvidence | null>(null)
const rawSelector = ref('')
const rawSelectorError = ref<string | undefined>()
const exportStatus = ref('')
const runtimeLoading = ref(false)
const { canUndo, canRedo } = storeToRefs(theme)
const paletteNames = PALETTE_NAMES
const paletteShades = PALETTE_SHADES
const activeMode = ref<ThemeMode>('light')
const foundationErrors = ref<Record<string, string>>({})
const uploadErrors = ref<Record<string, string>>({})
const surfaceNames = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'] as const
const typographyNames = ['body', 'heading', 'mono'] as const
const borderNames = ['default', 'strong'] as const
const textNames = ['primary', 'muted', 'disabled'] as const
const iconPackNames = ICON_PACK_NAMES
const resourceIconKeys = RESOURCE_ICON_KEYS
const iconOptions = [
  'heroicon-o-cube', 'heroicon-o-star', 'heroicon-o-bolt', 'heroicon-o-heart', 'heroicon-o-check-circle',
  'heroicon-s-cube', 'heroicon-s-star', 'heroicon-s-bolt', 'heroicon-s-heart', 'heroicon-s-check-circle',
  'heroicon-m-cube', 'heroicon-m-star', 'heroicon-m-bolt', 'heroicon-m-heart', 'heroicon-m-check-circle',
]
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
const productNameTarget = {
  targetId: 'form.product-name',
  controlId: 'background',
  componentId: 'form',
  variantId: 'default',
  stateId: 'focus',
} as const
const productNameScopes: ReadonlyArray<{ scope: ThemeScope; label: string }> = [
  { scope: 'global', label: 'Global' },
  { scope: 'component', label: 'Component' },
  { scope: 'variant', label: 'Variant' },
  { scope: 'state', label: 'State (focus)' },
]
const productNameRows = computed(() => productNameScopes.map((row) => {
  const request: ResolveRequest = {
    targetId: productNameTarget.targetId,
    controlId: productNameTarget.controlId,
    ...(row.scope === 'component' || row.scope === 'variant' || row.scope === 'state' ? { componentId: productNameTarget.componentId } : {}),
    ...(row.scope === 'variant' || row.scope === 'state' ? { variantId: productNameTarget.variantId } : {}),
    ...(row.scope === 'state' ? { stateId: productNameTarget.stateId } : {}),
  }
  const resolution = theme.resolve(request)
  const override = theme.theme.overrides.find((candidate) => sameOverrideKey(candidate, row.scope))
  return {
    ...row,
    request,
    value: resolution.status === 'resolved' && typeof resolution.value === 'string' ? resolution.value : '',
    source: resolution.status === 'resolved' ? resolution.source : 'unresolved',
    explicit: override !== undefined,
  }
}))
const inspectorRegistry = createThemeRegistry()
const rawProperties = ALL_RAW_VISUAL_PROPERTIES
const rawSelectorProposal = computed(() => selectedInspectorEvidence.value
  ? proposeRawSelector(selectedInspectorEvidence.value, inspectorRegistry)
  : { selector: null, quality: 'unavailable' as const })
const rawSelectorClassification = computed(() => rawSelector.value ? classifyRawSelector(rawSelector.value) : rawSelectorProposal.value)
const selectedRawOverride = computed(() => theme.theme.rawOverrides.find((override) => override.selector === rawSelector.value))

watch(rawSelectorProposal, (proposal) => {
  if (!rawSelector.value || rawSelectorError.value) rawSelector.value = proposal.selector ?? ''
}, { immediate: true })

function postInspectorCommand(enabled = inspectorEnabled.value): void {
  const target = iframe.value?.contentWindow
  if (!target) return
  const command: InspectorCommand = {
    type: enabled ? 'ftb:inspector:enable' : 'ftb:inspector:disable',
    protocolVersion: INSPECTOR_PROTOCOL_VERSION,
  }
  target.postMessage(command, new URL(previewUrl, window.location.href).origin)
}

function toggleInspector(): void {
  inspectorEnabled.value = !inspectorEnabled.value
  inspectorResolution.value = null
  postInspectorCommand()
}

function handleInspectorMessage(event: MessageEvent): void {
  const target = iframe.value?.contentWindow
  if (!target || event.source !== target || event.origin !== new URL(previewUrl, window.location.href).origin || !isInspectorEvent(event.data)) return
  const message = event.data as InspectorEvent
  if (message.type === 'ftb:inspector:ready') {
    if (inspectorEnabled.value) postInspectorCommand(true)
    return
  }
  if (message.type === 'ftb:inspector:clear') {
    inspectorResolution.value = null
    selectedInspectorEvidence.value = null
    rawSelector.value = ''
    return
  }
  const resolution = resolveInspectorTarget(inspectorRegistry, message.target)
  inspectorResolution.value = resolution
  if (message.type === 'ftb:inspector:select') {
    selectedInspectorEvidence.value = message.target
    rawSelectorError.value = undefined
    rawSelector.value = rawSelectorProposal.value.selector ?? ''
  }
  if (message.type === 'ftb:inspector:select' && resolution.status === 'editable' && resolution.editorTarget === 'form.product-name') {
    document.querySelector('[data-editor-target="form.product-name"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function onPreviewLoad(): void {
  runtimeLoading.value = false
  inspectorResolution.value = null
  selectedInspectorEvidence.value = null
  postTheme()
  postInspectorCommand()
}

function postTheme(): void {
  const target = iframe.value?.contentWindow
  if (!target) return
  const targetOrigin = new URL(previewUrl, window.location.href).origin
  target.postMessage(
    {
      type: 'ftb:theme:update',
       schemaVersion: 1,
       activeMode: activeMode.value,
       theme: structuredClone(JSON.parse(JSON.stringify(toRaw(theme.theme)))),
      projection: theme.previewFoundation(activeMode.value),
    },
    targetOrigin,
  )
}

function refreshRuntimePreview(): void {
  runtimeLoading.value = true
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(theme.theme.branding))))
  const separator = previewUrl.includes('?') ? '&' : '?'
  iframeSrc.value = `${previewUrl}${separator}ftb_branding=${encodeURIComponent(encoded)}`
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

watch(() => theme.theme.branding.logoHeight, postTheme)
watch(
  () => JSON.stringify([
    theme.theme.branding.appName,
    theme.theme.branding.lightLogo,
    theme.theme.branding.darkLogo,
    theme.theme.branding.brandTypography,
    theme.theme.branding.contentWidth,
    theme.theme.branding.sidebar,
  ]),
  refreshRuntimePreview,
)

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('message', handleInspectorMessage)
  postTheme()
  postInspectorCommand()
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('message', handleInspectorMessage)
})

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
  return isExplicitPath(foundation.value, provenancePath) || JSON.stringify(current) !== JSON.stringify(defaultValue) ? 'explicit' : 'inherited'
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
  const fullPath = `${path}.${activeMode.value}`
  const value = (event.target as HTMLInputElement).value
  const validation = validateFoundationColor(value)
  if (!validation.valid) {
    foundationErrors.value[fullPath] = validation.message
    return
  }
  delete foundationErrors.value[fullPath]
  theme.setFoundation(fullPath, value)
}

function foundationError(path: string): string | undefined {
  return foundationErrors.value[path]
}

function fontName(name: 'body' | 'heading' | 'mono'): string {
  return foundation.value.typography[name].name
}

function reset(path: string): void {
  delete foundationErrors.value[path]
  theme.resetFoundation(path)
}

function exportCanonicalJson(): void {
  const blob = new Blob([JSON.stringify(serializeCanonicalTheme(theme.theme), null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'filament-theme.json'
  link.click()
  URL.revokeObjectURL(url)
}

function exportIconPhp(): void {
  const blob = new Blob([exportIconConfigurationPhp(theme.theme.icons)], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'filament-panel-icon-config.php'
  link.click()
  URL.revokeObjectURL(url)
}

function exportBrandingJson(): void {
  downloadText('filament-panel-branding.json', exportPanelBrandingJson(theme.theme.branding), 'application/json')
}

function exportBrandingPhp(): void {
  downloadText('filament-panel-branding.php', exportPanelProviderBrandingPhp(theme.theme.branding), 'text/plain')
}

function exportVanillaThemeCss(): void {
  try {
    const result = exportVanillaCss(theme.theme as unknown as ThemeStateV4)
    downloadText('theme.css', result.css, 'text/css')
    exportStatus.value = result.errors.length ? `Vanilla CSS exported with errors: ${result.errors.join('; ')}` : 'Vanilla CSS download started.'
  } catch (error) {
    exportStatus.value = exportErrorMessage(error)
  }
}

async function copyVanillaThemeCss(): Promise<void> {
  let result: ReturnType<typeof exportVanillaCss>
  try {
    result = exportVanillaCss(theme.theme as unknown as ThemeStateV4)
  } catch (error) {
    exportStatus.value = exportErrorMessage(error)
    return
  }
  try {
    await navigator.clipboard.writeText(result.css)
    exportStatus.value = result.errors.length ? `Vanilla CSS copied with errors: ${result.errors.join('; ')}` : 'Vanilla CSS copied to clipboard.'
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = result.css
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.append(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    textarea.remove()
    exportStatus.value = copied
      ? result.errors.length ? `Vanilla CSS copied with errors: ${result.errors.join('; ')}` : 'Vanilla CSS copied to clipboard.'
      : 'Copy failed; use Download CSS instead.'
  }
}

function exportErrorMessage(error: unknown): string {
  return `Vanilla CSS export failed: ${error instanceof Error ? error.message : 'Unknown export error'}`
}

async function uploadBrandingAsset(setting: PanelBrandingSetting, event: Event): Promise<void> {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('asset', file)
  const response = await fetch('/api/branding-assets', { method: 'POST', body: form, credentials: 'same-origin' })
  if (!response.ok) {
    uploadErrors.value[setting] = 'Upload rejected. Use a JPEG, PNG, or WebP image within the temporary quota.'
    return
  }
  const payload = await response.json() as { reference?: string }
  if (typeof payload.reference !== 'string') {
    uploadErrors.value[setting] = 'Upload response did not contain a safe reference.'
    return
  }
  delete uploadErrors.value[setting]
  theme.setBrandingSetting(setting, payload.reference)
}

function setBrandTypography(event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'System') {
    theme.setBrandingSetting('brandTypography', { kind: 'system', name: 'System', family: 'ui-sans-serif, system-ui, sans-serif' })
    return
  }
  if (value === 'Inter' || value === 'Roboto') {
    theme.setBrandingSetting('brandTypography', { kind: 'curated', name: value, family: value, provider: 'google-fonts' })
  }
}

function downloadText(filename: string, contents: string, type: string): void {
  const blob = new Blob([contents], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  URL.revokeObjectURL(url)
  window.setTimeout(() => link.remove(), 0)
}

function setIconPack(event: Event): void {
  theme.setIconPack((event.target as HTMLSelectElement).value as IconPackName)
}

function iconOverrideValue(key: ResourceIconKey): string {
  return theme.theme.icons.overrides[key] ?? ''
}

function setIconOverride(key: ResourceIconKey, event: Event): void {
  const value = (event.target as HTMLSelectElement).value
  if (value) theme.setSemanticResourceIcon(key, value)
  else theme.resetSemanticResourceIcon(key)
}

function iconLabel(key: ResourceIconKey): string {
  return key.charAt(0).toUpperCase() + key.slice(1)
}

function iconPreview(key: ResourceIconKey): string {
  return theme.theme.icons.overrides[key] ?? ICON_PACK_PRESETS[theme.theme.icons.pack][key]
}

function downloadLegacyRecovery(): void {
  const archived = theme.getLegacyRecoveryJson()
  if (archived === null) return
  const blob = new Blob([archived], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'filament-theme-legacy-recovery.json'
  link.click()
  URL.revokeObjectURL(url)
}

function setProductNameValue(row: (typeof productNameRows.value)[number], event: Event): void {
  const value = (event.target as HTMLInputElement).value
  if (!/^#[\da-f]{6}$/i.test(value)) return
  const override: ThemeOverride = {
    targetId: productNameTarget.targetId,
    controlId: productNameTarget.controlId,
    scope: row.scope,
    value,
    ...(row.scope === 'component' || row.scope === 'variant' || row.scope === 'state' ? { componentId: productNameTarget.componentId } : {}),
    ...(row.scope === 'variant' || row.scope === 'state' ? { variantId: productNameTarget.variantId } : {}),
    ...(row.scope === 'state' ? { stateId: productNameTarget.stateId } : {}),
  }
  theme.setOverride(override)
}

function resetProductNameValue(row: (typeof productNameRows.value)[number]): void {
  theme.resetOverride(row.request)
}

function rawPropertyValue(property: RawVisualProperty): string {
  return selectedRawOverride.value?.properties[property] ?? ''
}

function setRawProperty(property: RawVisualProperty, event: Event): void {
  if (!rawSelector.value || !validateRawSelector(rawSelector.value).valid) return
  theme.setRawOverride(rawSelector.value, property, (event.target as HTMLInputElement).value.trim())
}

function resetRawProperty(property: RawVisualProperty): void {
  if (rawSelector.value) theme.resetRawProperty(rawSelector.value, property)
}

function resetRawOverride(): void {
  if (rawSelector.value) theme.resetRawOverride(rawSelector.value)
}

function setRawSelector(event: Event): void {
  const next = (event.target as HTMLInputElement).value.trim()
  const validation = validateRawSelector(next)
  rawSelectorError.value = validation.valid ? undefined : validation.error
  if (!validation.valid) {
    rawSelector.value = next
    return
  }
  const previous = rawSelector.value
  if (theme.theme.rawOverrides.some((override) => override.selector === previous)) {
    if (theme.renameRawOverride(previous, next)) rawSelector.value = next
    return
  }
  rawSelector.value = next
}

function sameOverrideKey(override: ThemeOverride, scope: ThemeScope): boolean {
  return override.targetId === productNameTarget.targetId
    && override.controlId === productNameTarget.controlId
    && override.scope === scope
    && (scope === 'global' || override.componentId === productNameTarget.componentId)
    && (scope === 'global' || scope === 'component' || override.variantId === productNameTarget.variantId)
    && (scope !== 'state' || override.stateId === productNameTarget.stateId)
}
</script>

<template>
  <HoverInspectPrototype
    v-if="inspectMode"
    :initial-variant="inspectVariant"
  />
  <ThrowawayThemePrototype
    v-else-if="prototypeMode"
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
      <button type="button" aria-label="Export theme JSON" @click="exportCanonicalJson">
        Export JSON
      </button>
      <button type="button" aria-label="Copy vanilla CSS" @click="copyVanillaThemeCss">
        Copy CSS
      </button>
      <button type="button" aria-label="Download vanilla CSS" @click="exportVanillaThemeCss">
        Download CSS
      </button>
      <button type="button" aria-label="Export PanelProvider icon config" @click="exportIconPhp">
        Export icon PHP
      </button>
      <button type="button" aria-label="Export panel branding JSON" @click="exportBrandingJson">
        Export branding JSON
      </button>
      <button type="button" aria-label="Export PanelProvider branding config" @click="exportBrandingPhp">
        Export branding PHP
      </button>
      <button type="button" aria-label="Undo" :disabled="!canUndo" @click="undo">Undo</button>
      <button type="button" aria-label="Redo" :disabled="!canRedo" @click="redo">Redo</button>
      <button type="button" aria-label="Inspector" :aria-pressed="inspectorEnabled" @click="toggleInspector">Inspector</button>
    </header>
    <p v-if="exportStatus" role="status" aria-label="Export status" aria-live="polite" data-export-status>{{ exportStatus }}</p>
    <p role="status" aria-label="Inspector status" aria-live="polite" data-inspector-status>
      <template v-if="!inspectorEnabled">Inspector disabled</template>
      <template v-else-if="inspectorResolution">{{ inspectorResolution.breadcrumb }}</template>
      <template v-else>Inspector enabled</template>
    </p>
    <p v-if="runtimeLoading" role="status" aria-live="polite" data-preview-loading>Refreshing runtime preview…</p>
    <aside v-if="theme.legacyRecoveryAvailable" role="alert" class="legacy-recovery">
      <strong>Legacy customization archived.</strong>
      <span>Unversioned foundation values are ambiguous; restore marks non-default legacy values explicit.</span>
      <p v-if="theme.legacyRecoveryError" role="status">{{ theme.legacyRecoveryError }}</p>
      <button type="button" aria-label="Restore legacy customization" :disabled="!!theme.legacyRecoveryError" @click="theme.restoreLegacyRecovery()">
        Restore legacy customization
      </button>
      <button type="button" aria-label="Download archived legacy JSON" @click="downloadLegacyRecovery">
        Download archived JSON
      </button>
    </aside>
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
            :aria-invalid="foundationError(`surfaces.${name}.${activeMode}`) ? 'true' : undefined"
            @input="setModeValue(`surfaces.${name}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`surfaces.${name}`) }}</span>
          <span v-if="foundationError(`surfaces.${name}.${activeMode}`)" :data-foundation-error="`surfaces.${name}.${activeMode}`" role="alert">{{ foundationError(`surfaces.${name}.${activeMode}`) }}</span>
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
            :aria-invalid="foundationError(`borders.${name}.${activeMode}`) ? 'true' : undefined"
            @input="setModeValue(`borders.${name}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`borders.${name}`) }}</span>
          <span v-if="foundationError(`borders.${name}.${activeMode}`)" :data-foundation-error="`borders.${name}.${activeMode}`" role="alert">{{ foundationError(`borders.${name}.${activeMode}`) }}</span>
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
            :aria-invalid="foundationError(`text.${name}.${activeMode}`) ? 'true' : undefined"
            @input="setModeValue(`text.${name}`, $event)"
          />
          <span role="status" aria-live="polite">{{ statusFor(`text.${name}`) }}</span>
          <span v-if="foundationError(`text.${name}.${activeMode}`)" :data-foundation-error="`text.${name}.${activeMode}`" role="alert">{{ foundationError(`text.${name}.${activeMode}`) }}</span>
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
    <section class="branding grid gap-4" aria-labelledby="branding-heading">
      <h2 id="branding-heading">Panel branding and runtime</h2>
      <p>CSS-previewable values apply immediately. PanelProvider values refresh the iframe without losing this draft.</p>
      <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
        <legend>PanelBrandingSettings</legend>
        <label for="brand-app-name">App name</label>
        <input id="brand-app-name" aria-label="App name" :value="theme.theme.branding.appName" @input="theme.setBrandingSetting('appName', ($event.target as HTMLInputElement).value)" />
        <label for="brand-light-logo">Light logo upload reference</label>
        <input id="brand-light-logo-file" aria-label="Upload light logo" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadBrandingAsset('lightLogo', $event)" />
        <input id="brand-light-logo" aria-label="Light logo upload reference" :value="theme.theme.branding.lightLogo ?? ''" @input="theme.setBrandingSetting('lightLogo', ($event.target as HTMLInputElement).value || null)" />
        <span v-if="uploadErrors.lightLogo" role="alert">{{ uploadErrors.lightLogo }}</span>
        <label for="brand-dark-logo">Dark logo upload reference</label>
        <input id="brand-dark-logo-file" aria-label="Upload dark logo" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadBrandingAsset('darkLogo', $event)" />
        <input id="brand-dark-logo" aria-label="Dark logo upload reference" :value="theme.theme.branding.darkLogo ?? ''" @input="theme.setBrandingSetting('darkLogo', ($event.target as HTMLInputElement).value || null)" />
        <span v-if="uploadErrors.darkLogo" role="alert">{{ uploadErrors.darkLogo }}</span>
        <label for="brand-favicon">Favicon upload reference</label>
        <input id="brand-favicon-file" aria-label="Upload favicon" type="file" accept="image/jpeg,image/png,image/webp" @change="uploadBrandingAsset('favicon', $event)" />
        <input id="brand-favicon" aria-label="Favicon upload reference" :value="theme.theme.branding.favicon ?? ''" @input="theme.setBrandingSetting('favicon', ($event.target as HTMLInputElement).value || null)" />
        <span v-if="uploadErrors.favicon" role="alert">{{ uploadErrors.favicon }}</span>
        <label for="brand-logo-height">Logo height (CSS-previewable)</label>
        <input id="brand-logo-height" aria-label="Logo height" :value="theme.theme.branding.logoHeight" @input="theme.setBrandingSetting('logoHeight', ($event.target as HTMLInputElement).value)" />
        <label for="brand-font">Brand typography</label>
        <select id="brand-font" aria-label="Brand typography" :value="theme.theme.branding.brandTypography.name" @change="setBrandTypography">
          <option value="System">System</option>
          <option value="Inter">Inter (Google Fonts)</option>
          <option value="Roboto">Roboto (Google Fonts)</option>
        </select>
        <label for="brand-custom-font">Custom Google Font family</label>
        <input id="brand-custom-font" aria-label="Custom Google Font family" :value="theme.theme.branding.brandTypography.kind === 'custom' ? theme.theme.branding.brandTypography.family : ''" placeholder="Example: Source Sans 3" @change="theme.setBrandingSetting('brandTypography', { kind: 'custom', name: ($event.target as HTMLInputElement).value.trim(), family: ($event.target as HTMLInputElement).value.trim() })" />
        <label for="brand-content-width">Content width</label>
        <select id="brand-content-width" aria-label="Content width" :value="theme.theme.branding.contentWidth" @change="theme.setBrandingSetting('contentWidth', ($event.target as HTMLSelectElement).value as any)">
          <option v-for="value in ['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl', 'full']" :key="value" :value="value">{{ value }}</option>
        </select>
        <label for="brand-sidebar">Sidebar behavior</label>
        <select id="brand-sidebar" aria-label="Sidebar behavior" :value="theme.theme.branding.sidebar" @change="theme.setBrandingSetting('sidebar', ($event.target as HTMLSelectElement).value as any)">
          <option value="collapsible">Collapsible</option>
          <option value="fully-collapsible">Fully collapsible</option>
          <option value="top-navigation">Top navigation</option>
        </select>
        <button type="button" aria-label="Reset panel branding" @click="theme.resetBranding">Reset panel branding</button>
      </fieldset>
    </section>
    <section class="icons grid gap-4" aria-labelledby="icons-heading">
      <h2 id="icons-heading">Icons</h2>
      <p>Heroicons are runtime Filament configuration. Preview changes apply to rendered icons immediately.</p>
      <fieldset class="grid gap-4 rounded-lg border border-zinc-200 p-4">
        <legend>IconPackConfiguration</legend>
        <label for="icon-pack">Icon pack</label>
        <select id="icon-pack" aria-label="Icon pack" :value="theme.theme.icons.pack" @change="setIconPack">
          <option v-for="pack in iconPackNames" :key="pack" :value="pack">{{ pack }}</option>
        </select>
        <button type="button" aria-label="Reset icon configuration" @click="theme.resetIconConfiguration">Reset icon configuration</button>
        <div
          v-for="key in resourceIconKeys"
          :key="key"
          class="icon-control-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]"
        >
          <label :for="`${key}-semantic-icon`">{{ iconLabel(key) }} semantic icon override</label>
          <select :id="`${key}-semantic-icon`" :aria-label="`${iconLabel(key)} semantic icon override`" :value="iconOverrideValue(key)" @change="setIconOverride(key, $event)">
            <option value="">Inherited from pack ({{ iconPreview(key) }})</option>
            <option v-for="icon in iconOptions" :key="icon" :value="icon">{{ icon }}</option>
          </select>
          <span role="status">{{ iconPreview(key) }}</span>
          <button type="button" :aria-label="`Reset ${key} semantic icon`" @click="theme.resetSemanticResourceIcon(key)">Reset</button>
        </div>
      </fieldset>
    </section>
    <section class="component-controls grid gap-4" aria-labelledby="component-controls-heading" data-editor-target="form.product-name">
      <h2 id="component-controls-heading">Component controls</h2>
      <p>Product name input · <code>.fi-fo-text-input .fi-input</code> · background color</p>
      <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
        <legend>Global → Component → Variant → State</legend>
        <div
          v-for="row in productNameRows"
          :key="row.scope"
          class="component-control-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto_auto]"
        >
          <label :for="`product-name-${row.scope}-background`">Product name {{ row.label }} background</label>
          <input
            :id="`product-name-${row.scope}-background`"
            type="text"
            :aria-label="`Product name ${row.scope} background`"
            :value="row.value"
            @input="setProductNameValue(row, $event)"
          />
          <span role="status" :data-theme-source="row.source">{{ row.explicit ? `Explicit (${row.source})` : `Inherited from ${row.source}` }}</span>
          <button type="button" :aria-label="`Reset Product name ${row.scope} background`" @click="resetProductNameValue(row)">
            Reset to inherit
          </button>
        </div>
      </fieldset>
    </section>
    <section v-if="selectedInspectorEvidence" class="advanced-inspector grid gap-4" aria-labelledby="advanced-inspector-heading" data-advanced-inspector>
      <h2 id="advanced-inspector-heading">Advanced Inspector</h2>
      <p>Raw visual overrides are validated typed properties and remain separate from Semantic controls.</p>
      <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
        <legend>Raw element target</legend>
        <label for="raw-selector">Selector</label>
        <input id="raw-selector" aria-label="Raw element selector" :value="rawSelector" :aria-invalid="rawSelectorError ? 'true' : undefined" @input="setRawSelector" />
        <p v-if="rawSelectorClassification.quality === 'fragile'" role="alert" data-selector-warning>{{ rawSelectorClassification.warning }}</p>
        <p v-if="rawSelectorError" role="alert">{{ rawSelectorError }}</p>
        <p v-else-if="rawSelectorClassification.quality === 'stable'" role="status">Stable Filament selector proposed.</p>
        <p v-else-if="rawSelectorClassification.quality === 'unavailable'" role="alert">No safe selector was detected.</p>
      </fieldset>
      <fieldset class="grid gap-2 rounded-lg border border-zinc-200 p-4">
        <legend>Visual properties</legend>
        <div v-for="property in rawProperties" :key="property" class="raw-property-row grid grid-cols-1 gap-2 md:grid-cols-[minmax(10rem,1fr)_minmax(12rem,2fr)_auto]">
          <label :for="`raw-${property}`">{{ property }}</label>
          <input :id="`raw-${property}`" :aria-label="`Raw ${property}`" :value="rawPropertyValue(property)" @input="setRawProperty(property, $event)" />
          <button type="button" :aria-label="`Reset raw ${property}`" @click="resetRawProperty(property)">Reset</button>
        </div>
        <button type="button" aria-label="Reset raw element override" @click="resetRawOverride">Reset raw override</button>
      </fieldset>
    </section>
    <iframe
      ref="iframe"
      :src="iframeSrc"
      title="Filament preview"
      class="preview-shell__frame"
      @load="onPreviewLoad"
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

.advanced-inspector {
  max-height: 45vh;
  overflow: auto;
  padding: 0 1rem 1rem;
}

.raw-property-row {
  align-items: center;
}

@media (max-width: 767px) {
  .advanced-inspector {
    max-height: 50vh;
  }
}
</style>
