<script setup lang="ts">
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeState,
  ColorChoicePrototypeTarget,
} from '@/models/color-choice-prototype.model'
import ColorChoicePrototypeBoundField from '@/components/ColorChoicePrototypeBoundField.vue'
import ColorChoicePrototypePalettes from '@/components/ColorChoicePrototypePalettes.vue'
const props = defineProps<{ state: ColorChoicePrototypeState; host: ColorChoicePrototypeHost }>()
const groups = ['surfaces', 'borders', 'text'] as const
const labels = {
  page: 'Page',
  sidebar: 'Sidebar',
  topbar: 'Topbar',
  card: 'Card',
  elevated: 'Elevated',
  input: 'Input',
  default: 'Default border',
  strong: 'Strong border',
  primary: 'Primary text',
  muted: 'Muted text',
  disabled: 'Disabled text',
}
const title = (key: string) => labels[key as keyof typeof labels]
function targets(group: (typeof groups)[number]): ColorChoicePrototypeTarget[] {
  const source = props.state.theme.foundations[group],
    defaults = props.state.defaults.foundations[group]
  return Object.entries(source).map(([key, values]) =>
    props.state.target(
      `${group}:${key}:${props.state.mode.value}`,
      `${title(key)} · ${props.state.mode.value}`,
      values[props.state.mode.value],
      defaults[key as keyof typeof defaults][props.state.mode.value],
      group === 'surfaces' ? 'surface' : group === 'borders' ? 'border' : 'text',
      key,
      undefined,
      props.state.mode.value,
    ),
  )
}
function changeMode(value: 'light' | 'dark') {
  props.state.close()
  props.state.mode.value = value
}
</script>

<template>
  <div class="ccp-heading">
    <div>
      <small>FOUNDATIONS / COLOR</small>
      <h1>Theme colors</h1>
      <p>Local scratch only · edits reset when you reload.</p>
    </div>
    <div class="ccp-mode">
      <button
        v-for="mode in ['light', 'dark'] as const"
        :key="mode"
        :aria-pressed="state.mode.value === mode"
        @click="changeMode(mode)"
      >
        {{ mode }}
      </button>
    </div>
  </div>
  <ColorChoicePrototypePalettes :state="state" :host="host" />
  <section class="ccp-panel">
    <header>
      <span>02 · APPEARANCE</span>
      <h2>Surfaces, borders & text</h2>
      <small>Editing {{ state.mode.value }} values</small>
    </header>
    <div v-for="group in groups" :key="group" class="ccp-field-group">
      <h3>{{ group }}</h3>
      <ColorChoicePrototypeBoundField
        v-for="field in targets(group)"
        :key="field.path"
        :state="state"
        :target="field"
        :host="host"
      />
    </div>
  </section>
</template>
