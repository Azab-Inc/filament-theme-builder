<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ColorChoicePrototypeField from '@/components/ColorChoicePrototypeField.vue'
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeState,
  ColorChoicePrototypeTarget,
} from '@/models/color-choice-prototype.model'
import {
  TAILWIND_COLOR_FAMILIES,
  TAILWIND_COLOR_SHADES,
  resolveTrustedColorReference,
} from '@/registry/tailwind-color-catalog'
const props = defineProps<{
  state: ColorChoicePrototypeState
  target: ColorChoicePrototypeTarget
  host: ColorChoicePrototypeHost
}>()
const value = computed(() => props.state.getValue(props.target)),
  meta = computed(() => props.state.getMeta(props.target.path))
const textValue = ref(value.value),
  inputDraft = ref(''),
  invalid = ref(false)
watch(value, (next) => {
  textValue.value = next
  invalid.value = false
})
function resolveSwatch(current: string): string {
  const match = /^var\(--([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950)\)$/.exec(current)
  if (match) {
    const family = match[1]!,
      shade = Number(match[2]!)
    if ((props.state.palettes as readonly string[]).includes(family))
      return (
        props.state.theme.foundations.palettes[family as (typeof props.state.palettes)[number]]
          .shades[shade as (typeof props.state.shades)[number]] ??
        props.state.theme.foundations.palettes[family as (typeof props.state.palettes)[number]].base
      )
    if (
      TAILWIND_COLOR_FAMILIES.includes(family as (typeof TAILWIND_COLOR_FAMILIES)[number]) &&
      TAILWIND_COLOR_SHADES.includes(shade as (typeof TAILWIND_COLOR_SHADES)[number])
    )
      return resolveTrustedColorReference(`var(--color-${family}-${shade})`) ?? current
  }
  return current
}
const swatch = computed(() => resolveSwatch(value.value))
function open(event: MouseEvent) {
  const box = (event.currentTarget as HTMLElement).getBoundingClientRect()
  inputDraft.value = value.value
  props.state.open(props.target, { left: box.left, top: box.bottom + 8 })
}
function apply(next: string, token: string | null = null, originalValue?: string) {
  if (props.state.apply(props.target, next, token, originalValue)) {
    textValue.value = next
    invalid.value = false
  } else invalid.value = true
}
function commitText() {
  apply(textValue.value)
}
function reset() {
  props.state.reset(props.target)
  textValue.value = value.value
  invalid.value = false
}
</script>

<template>
  <ColorChoicePrototypeField
    :target="target"
    :host="host"
    :value="value"
    :swatch="swatch"
    :token="meta.token"
    :original-value="meta.originalValue"
    :source="meta.source"
    :changed="state.changed.value.has(target.path)"
    :open="state.activePath.value === target.path"
    :tab="state.tab.value"
    :search="state.search.value"
    :draft="state.draft.value"
    :text-value="textValue"
    :invalid="invalid"
    :anchor="state.anchor.value"
    @open="open"
    @close="state.close()"
    @reset="reset"
    @select="apply"
    @commit="commitText"
    @update:text="textValue = $event"
    @update:tab="state.tab.value = $event"
    @update:search="state.search.value = $event"
    @update:draft="state.draft.value = $event"
  />
</template>
