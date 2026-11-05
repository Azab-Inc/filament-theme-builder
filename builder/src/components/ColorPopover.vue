<script setup lang="ts">
import { computed, nextTick, onUnmounted, shallowRef, watch } from 'vue'
import CustomColorPanel from '@/components/CustomColorPanel.vue'
import TailwindColorPanel from '@/components/TailwindColorPanel.vue'
import ThemeColorPanel from '@/components/ThemeColorPanel.vue'
import { usePopoverPosition } from '@/composables/use-popover-position'
import type { ColorPopoverProps, ColorPopoverEmits } from '@/models/color-popover.model'
import type { TailwindColor } from '@/models/tailwind-palette.model'
import { findTailwindColor } from '@/utils/tailwind-palette'
import { isTransparentColorAllowed } from '@/utils/color-field-validation'
import { legacyPaletteReferenceLabel } from '@/utils/color-reference-options'

const props = defineProps<ColorPopoverProps>()
const emit = defineEmits<ColorPopoverEmits>()
const panel = shallowRef<HTMLElement | null>(null)
const tab = shallowRef<'Custom' | 'Tailwind' | 'Theme'>('Tailwind')
const position = shallowRef({ top: 8, left: 8 })
const selected = computed(() => findTailwindColor(props.value))
const allowTransparent = computed(() => !props.nativePrimary && isTransparentColorAllowed(props.profile, props.property))
const selectedReference = computed(() => props.referenceOptions?.find((option) => option.value === props.value)?.label ?? legacyPaletteReferenceLabel(props.value))
const trigger = computed(() => props.triggerElement)
const tabs = computed(() => props.referenceOptions?.length ? ['Custom', 'Tailwind', 'Theme'] as const : ['Custom', 'Tailwind'] as const)
watch(() => props.referenceOptions?.length, (count) => { if (!count && tab.value === 'Theme') tab.value = 'Tailwind' })
usePopoverPosition(computed(() => props.open), trigger, panel, position)
function close(restoreFocus = false): void { emit('close'); if (restoreFocus) nextTick(() => props.triggerElement?.focus()) }
function keydown(event: KeyboardEvent): void { if (event.key === 'Escape') { event.preventDefault(); close(true) } }
function outside(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!panel.value?.contains(target) && !props.triggerElement?.contains(target)) close()
}
watch(() => props.open, async (open) => {
  if (!open) { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside, true); return }
  tab.value = 'Tailwind'
  await nextTick()
  if (!props.open) return
  document.addEventListener('keydown', keydown)
  document.addEventListener('pointerdown', outside, true)
  panel.value?.querySelector<HTMLInputElement>('[type="search"]')?.focus()
}, { flush: 'post', immediate: true })
onUnmounted(() => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside, true) })
function choose(color: TailwindColor): void { if (color.value === 'transparent') apply(color.value); else { emit('select', color); close(true) } }
function apply(value: string): void { emit('apply', value); close(true) }
function moveTab(event: KeyboardEvent, current: 'Custom' | 'Tailwind' | 'Theme'): void {
  const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (!keys.includes(event.key)) return
  event.preventDefault()
  const currentIndex = (tabs.value as readonly string[]).indexOf(current)
  tab.value = event.key === 'Home' ? tabs.value[0] : event.key === 'End' ? tabs.value[tabs.value.length - 1]! : tabs.value[(currentIndex + (event.key === 'ArrowRight' ? 1 : tabs.value.length - 1)) % tabs.value.length]!
  nextTick(() => panel.value?.querySelector<HTMLElement>(`[aria-selected="true"]`)?.focus())
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" :id="`${id}-color-popover`" ref="panel" class="color-popover" role="dialog" :aria-label="`${label} color choices`"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }">
      <header class="color-popover__header"><strong>{{ label }}</strong><button type="button" :aria-label="`Close ${label} color choices`" @click="close(true)">×</button><code :title="value">{{ selectedReference || value || 'Generated / inherited' }}</code></header>
      <div class="color-popover__tabs" role="tablist" :aria-label="`${label} color source`">
        <button :id="`${id}-custom-tab`" type="button" role="tab" :tabindex="tab === 'Custom' ? 0 : -1" :aria-controls="`${id}-custom-panel`" :aria-selected="tab === 'Custom'" @keydown="moveTab($event, 'Custom')" @click="tab = 'Custom'">Custom</button>
        <button :id="`${id}-tailwind-tab`" type="button" role="tab" :tabindex="tab === 'Tailwind' ? 0 : -1" :aria-controls="`${id}-tailwind-panel`" :aria-selected="tab === 'Tailwind'" @keydown="moveTab($event, 'Tailwind')" @click="tab = 'Tailwind'">Tailwind</button>
        <button v-if="referenceOptions?.length" :id="`${id}-theme-tab`" type="button" role="tab" :tabindex="tab === 'Theme' ? 0 : -1" :aria-controls="`${id}-theme-panel`" :aria-selected="tab === 'Theme'" @keydown="moveTab($event, 'Theme')" @click="tab = 'Theme'">Theme</button>
      </div>
      <div v-if="tab === 'Custom'" :id="`${id}-custom-panel`" role="tabpanel" :aria-labelledby="`${id}-custom-tab`">
        <CustomColorPanel :id="id" :value="value" :effective-value="effectiveValue" :profile="profile" :label="label" :property="property" :native-primary="nativePrimary" @apply="apply" />
      </div>
      <TailwindColorPanel v-else-if="tab === 'Tailwind'" :id="id" :selected-value="value" :allow-transparent="allowTransparent" @select="choose" />
      <div v-else :id="`${id}-theme-panel`" class="color-popover__theme-panel" role="tabpanel" :aria-labelledby="`${id}-theme-tab`">
        <ThemeColorPanel :id="id" :options="referenceOptions ?? []" :selected-value="value" @select="apply" />
      </div>
      <p v-if="selected" class="color-popover__selected" role="status">Selected: {{ selected.name }} {{ selected.value }}</p>
    </div>
  </Teleport>
</template>
