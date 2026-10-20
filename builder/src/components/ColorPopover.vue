<script setup lang="ts">
import { computed, nextTick, onUnmounted, shallowRef, watch } from 'vue'
import CustomColorPanel from '@/components/CustomColorPanel.vue'
import TailwindColorPanel from '@/components/TailwindColorPanel.vue'
import { usePopoverPosition } from '@/composables/use-popover-position'
import type { ColorFieldProfile } from '@/utils/color-field-validation'
import type { TailwindColor } from '@/models/tailwind-palette.model'
import type { RawVisualProperty } from '@/models/raw-overrides.model'
import { findTailwindColor } from '@/utils/tailwind-palette'

const props = defineProps<{ id: string; label: string; open: boolean; value: string; profile: ColorFieldProfile; triggerElement: HTMLElement | null; property?: RawVisualProperty }>()
const emit = defineEmits<{ close: []; select: [color: TailwindColor]; apply: [value: string] }>()
const panel = shallowRef<HTMLElement | null>(null)
const tab = shallowRef<'Custom' | 'Tailwind'>('Tailwind')
const position = shallowRef({ top: 8, left: 8 })
const selected = computed(() => findTailwindColor(props.value))
const trigger = computed(() => props.triggerElement)
usePopoverPosition(computed(() => props.open), trigger, panel, position)
function close(restoreFocus = false): void { emit('close'); if (restoreFocus) nextTick(() => props.triggerElement?.focus()) }
function keydown(event: KeyboardEvent): void { if (event.key === 'Escape') { event.preventDefault(); close(true) } }
function outside(event: PointerEvent): void {
  const target = event.target as Node | null
  if (!panel.value?.contains(target) && !props.triggerElement?.contains(target)) close()
}
watch(() => props.open, async (open) => {
  if (!open) { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside, true); return }
  await nextTick()
  if (!props.open) return
  document.addEventListener('keydown', keydown)
  document.addEventListener('pointerdown', outside, true)
  panel.value?.querySelector<HTMLInputElement>('[type="search"]')?.focus()
}, { flush: 'post' })
onUnmounted(() => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', outside, true) })
function choose(color: TailwindColor): void { emit('select', color); close(true) }
function apply(value: string): void { emit('apply', value); close(true) }
</script>

<template>
  <Teleport to="body">
    <div v-if="open" :id="`${id}-color-popover`" ref="panel" class="color-popover" role="dialog" :aria-label="`${label} color choices`"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }">
      <div class="color-popover__tabs" role="tablist" :aria-label="`${label} color source`">
        <button :id="`${id}-custom-tab`" type="button" role="tab" :aria-controls="`${id}-custom-panel`" :aria-selected="tab === 'Custom'" @click="tab = 'Custom'">Custom</button>
        <button :id="`${id}-tailwind-tab`" type="button" role="tab" :aria-controls="`${id}-tailwind-panel`" :aria-selected="tab === 'Tailwind'" @click="tab = 'Tailwind'">Tailwind</button>
      </div>
      <div v-if="tab === 'Custom'" :id="`${id}-custom-panel`" role="tabpanel" :aria-labelledby="`${id}-custom-tab`">
        <CustomColorPanel :value="value" :profile="profile" :label="label" :property="property" @apply="apply" />
      </div>
      <TailwindColorPanel v-else :id="id" :selected-value="value" @select="choose" />
      <p v-if="selected" class="color-popover__selected" role="status">Selected: {{ selected.name }} {{ selected.value }}</p>
    </div>
  </Teleport>
</template>
