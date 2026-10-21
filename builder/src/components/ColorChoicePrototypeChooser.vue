<script setup lang="ts">
import ColorChoicePrototypeCustom from '@/components/ColorChoicePrototypeCustom.vue'
import ColorChoicePrototypeTailwind from '@/components/ColorChoicePrototypeTailwind.vue'
import type {
  ColorChoicePrototypeHost,
  ColorChoicePrototypeTarget,
} from '@/models/color-choice-prototype.model'
import { isColorChoicePrototypeDraft } from '@/utils/color-choice-prototype-colors'
import { onMounted, onUnmounted } from 'vue'
defineProps<{
  target: ColorChoicePrototypeTarget
  host: ColorChoicePrototypeHost
  value: string
  swatch: string
  token: string | null
  originalValue?: string
  tab: 'Custom' | 'Tailwind'
  search: string
  draft: string
  anchor: { left: number; top: number }
}>()
const emit = defineEmits<{
  close: []
  select: [value: string, token: string | null, originalValue?: string]
  'update:tab': [value: 'Custom' | 'Tailwind']
  'update:search': [value: string]
  'update:draft': [value: string]
}>()
function outside(event: PointerEvent) {
  if (!(event.target as HTMLElement).closest('.ccp-chooser,.ccp-swatch-button,.ccp-open'))
    emit('close')
}
onMounted(() => document.addEventListener('pointerdown', outside))
onUnmounted(() => document.removeEventListener('pointerdown', outside))
function choose(value: string, token: string | null = null, originalValue?: string) {
  emit('select', value, token, originalValue)
}
</script>

<template>
  <section
    class="ccp-chooser"
    :class="`ccp-chooser--${host.toLowerCase()}`"
    :style="
      host === 'A' ? { '--ccp-x': `${anchor.left}px`, '--ccp-y': `${anchor.top}px` } : undefined
    "
    role="dialog"
    aria-label="Choose color"
  >
    <header>
      <b>{{ target.label }}</b
      ><button aria-label="Close color chooser" @click="emit('close')">×</button>
    </header>
    <p class="ccp-current">
      <i :style="{ background: swatch }"></i><code>{{ value }}</code
      ><span>{{ target.path }}</span>
    </p>
    <p class="ccp-current-meta">
      Source: {{ token ? 'Tailwind' : 'Custom / default' }}
      <b v-if="token" class="ccp-token-badge">{{ token }}</b
      ><small v-if="token">{{ originalValue || value }} → {{ value }}</small>
    </p>
    <nav class="ccp-tabs">
      <button
        v-for="choice in ['Custom', 'Tailwind'] as const"
        :key="choice"
        :aria-pressed="tab === choice"
        @click="emit('update:tab', choice)"
      >
        {{ choice }}
      </button>
    </nav>
    <ColorChoicePrototypeCustom
      v-if="tab === 'Custom'"
      :value="value"
      :draft="draft"
      :can-pick-native="/^#[\da-f]{6}$/i.test(value)"
      :valid="isColorChoicePrototypeDraft(draft)"
      @select="choose($event)"
      @update:draft="emit('update:draft', $event)"
      @apply="choose(draft)"
    />
    <ColorChoicePrototypeTailwind
      v-else
      :search="search"
      @select="choose"
      @update:search="emit('update:search', $event)"
    />
  </section>
</template>
