<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { ColorChoicePrototypeHost } from '@/models/color-choice-prototype.model'
const props = defineProps<{ variant: ColorChoicePrototypeHost }>()
const variants: ColorChoicePrototypeHost[] = ['A', 'B', 'C']
const labels: Record<ColorChoicePrototypeHost, string> = {
  A: 'Popover',
  B: 'Inline',
  C: 'Sidepanel',
}
function go(offset: number) {
  const index = variants.indexOf(props.variant)
  const next = variants[(index + offset + variants.length) % variants.length] ?? 'A'
  const url = new URL(location.href)
  url.searchParams.set('color-prototype', '1')
  url.searchParams.set('variant', next)
  history.replaceState(null, '', url)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
function keys(event: KeyboardEvent) {
  const target = event.target as HTMLElement
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return
  if (event.key === 'ArrowLeft') {
    event.preventDefault()
    go(-1)
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    go(1)
  }
}
onMounted(() => window.addEventListener('keydown', keys))
onUnmounted(() => window.removeEventListener('keydown', keys))
</script>

<template>
  <nav class="ccp-switcher" aria-label="Chooser host variations">
    <button aria-label="Previous variant" @click="go(-1)">←</button
    ><span
      >{{ variant }} <small>{{ labels[variant] }}</small></span
    >
    <div>
      <button
        v-for="key in variants"
        :key="key"
        :aria-current="variant === key ? 'page' : undefined"
        :aria-label="`${key} ${labels[key]} host`"
        @click="go(variants.indexOf(key) - variants.indexOf(variant))"
      >
        {{ key }}
      </button>
    </div>
    <button aria-label="Next variant" @click="go(1)">→</button>
  </nav>
</template>
