<script setup lang="ts">
import ColorChoicePrototypeChooser from '@/components/ColorChoicePrototypeChooser.vue'
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeTarget,
} from '@/models/color-choice-prototype.model'
const props = defineProps<{
  target: ColorChoicePrototypeTarget
  host: ColorChoicePrototypeHost
  value: string
  swatch: string
  token: string | null
  originalValue?: string
  source: string
  changed: boolean
  open: boolean
  tab: 'Custom' | 'Tailwind'
  search: string
  draft: string
  textValue: string
  invalid: boolean
  anchor: { left: number; top: number }
}>()
const emit = defineEmits<{
  open: [event: MouseEvent]
  close: []
  reset: []
  select: [value: string, token: string | null, originalValue?: string]
  'update:tab': [value: 'Custom' | 'Tailwind']
  'update:search': [value: string]
  'update:draft': [value: string]
  'update:text': [value: string]
  commit: []
}>()
function selectColor(value: string, token: string | null, originalValue?: string) {
  emit('select', value, token, originalValue)
}
</script>

<template>
  <div class="ccp-field" :class="{ 'ccp-field--open': open }">
    <label class="ccp-label" :for="`field-${target.path}`"
      >{{ target.label }}<small v-if="changed">Changed</small
      ><b v-if="token" class="ccp-token-badge">{{ token }}</b
      ><small>{{ source }}</small></label
    >
    <div class="ccp-control">
      <button
        class="ccp-swatch-button"
        :aria-label="`Choose color for ${target.label}`"
        @click="emit('open', $event)"
      >
        <i :style="{ background: swatch }"></i>
      </button>
      <input
        :id="`field-${target.path}`"
        class="ccp-value"
        :class="{ 'ccp-invalid-input': invalid }"
        :value="textValue"
        spellcheck="false"
        :aria-label="`${target.label} value`"
        @input="emit('update:text', ($event.target as HTMLInputElement).value)"
        @change="emit('commit')"
      />
      <button class="ccp-open" @click="emit('open', $event)">Choose</button
      ><button class="ccp-reset" @click="emit('reset')">Reset</button>
    </div>
    <ColorChoicePrototypeChooser
      v-if="open"
      :target="target"
      :host="host"
      :value="value"
      :swatch="swatch"
      :token="token"
      :original-value="originalValue"
      :tab="tab"
      :search="search"
      :draft="draft"
      :anchor="anchor"
      @close="emit('close')"
      @select="selectColor"
      @update:tab="emit('update:tab', $event)"
      @update:search="emit('update:search', $event)"
      @update:draft="emit('update:draft', $event)"
    />
  </div>
</template>
