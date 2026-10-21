<script setup lang="ts">
import { computed } from 'vue'
import type { PaletteName } from '@/models/foundations.model'
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeState,
} from '@/models/color-choice-prototype.model'
import ColorChoicePrototypeBoundField from '@/components/ColorChoicePrototypeBoundField.vue'
const props = defineProps<{
  state: ColorChoicePrototypeState
  name: PaletteName
  host: ColorChoicePrototypeHost
}>()
const palette = computed(() => props.state.theme.foundations.palettes[props.name])
const edited = computed(
  () =>
    [...props.state.changed.value].filter((path) => path.startsWith(`palette:${props.name}:`))
      .length,
)
function base() {
  return props.state.target(
    `palette:${props.name}:base`,
    `${props.name} base`,
    palette.value.base,
    props.state.defaults.foundations.palettes[props.name].base,
    'palette',
    props.name,
    'base',
  )
}
function shade(stop: (typeof props.state.shades)[number]) {
  const source = palette.value,
    value = source.shades[stop] ?? source.base
  return props.state.target(
    `palette:${props.name}:${stop}`,
    `${props.name} ${stop}`,
    value,
    props.state.defaults.foundations.palettes[props.name].shades[stop] ?? value,
    'palette',
    props.name,
    stop,
  )
}
function toggle(event: Event) {
  const details = event.currentTarget as HTMLDetailsElement
  props.state.openPalette.value = details.open ? props.name : null
  if (!details.open && props.state.activePath.value?.startsWith(`palette:${props.name}:`))
    props.state.close()
}
</script>

<template>
  <details class="ccp-palette-item" :open="state.openPalette.value === name" @toggle="toggle">
    <summary>
      <b>{{ name }}</b
      ><code>{{ palette.base }}</code
      ><span class="ccp-ramp-summary" :aria-label="`${name} shade ramp`"
        ><i
          v-for="shadeNumber in state.shades"
          :key="shadeNumber"
          :title="`${name}-${shadeNumber}`"
          :style="{ background: palette.shades[shadeNumber] }"
        ></i></span
      ><small>{{ edited }} changed / 11 shades</small>
    </summary>
    <ColorChoicePrototypeBoundField :state="state" :target="base()" :host="host" />
    <ColorChoicePrototypeBoundField
      v-for="shadeNumber in state.shades"
      :key="shadeNumber"
      :state="state"
      :target="shade(shadeNumber)"
      :host="host"
    />
  </details>
</template>
