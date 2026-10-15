<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// PROTOTYPE—throwaway exploration; not connected to theme state or production editing.
type Variant = 'A' | 'B' | 'C'

const props = defineProps<{ initialVariant: string; previewUrl: string }>()
const variants: Variant[] = ['A', 'B', 'C']
const activeVariant = ref<Variant>(
  variants.includes(props.initialVariant as Variant) ? (props.initialVariant as Variant) : 'A',
)
const variantName = computed(() => ({
  A: 'Split workspace',
  B: 'Command center',
  C: 'Floating inspector',
})[activeVariant.value])

function setVariant(variant: Variant): void {
  activeVariant.value = variant
  const url = new URL(window.location.href)
  url.searchParams.set('prototype', '1')
  url.searchParams.set('variant', variant)
  window.history.replaceState({}, '', url)
}

function stepVariant(direction: number): void {
  const index = variants.indexOf(activeVariant.value)
  setVariant(variants[(index + direction + variants.length) % variants.length]!)
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return
  event.preventDefault()
  stepVariant(event.key === 'ArrowRight' ? 1 : -1)
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <!-- PROTOTYPE—remove this component and App.vue gate after the design exploration. -->
  <main class="prototype" :class="`prototype--${activeVariant.toLowerCase()}`" :data-prototype="activeVariant">
    <header class="prototype__toolbar">
      <div class="prototype__brand"><span class="prototype__mark">F</span><span>Filament <b>Theme Studio</b></span></div>
      <div class="prototype__context"><span class="prototype__live-dot"></span> Live preview <span class="prototype__divider">/</span> Admin panel</div>
      <div class="prototype__toolbar-actions"><span class="prototype__saved">● Saved just now</span><button type="button">Share</button><button class="prototype__publish" type="button">Publish theme ↗</button></div>
    </header>

    <section class="prototype__editor" aria-label="Theme editor">
      <div class="prototype__eyebrow">THEME CONFIGURATION <span>01 — 04</span></div>
      <h1>Shape your<br /><em>workspace.</em></h1>
      <p class="prototype__intro">A considered palette, a clear type system, and the details that make it yours.</p>

      <section class="prototype__group">
        <div class="prototype__section-title"><span>01</span><h2>Primary</h2><button type="button">↗</button></div>
        <div class="prototype__primary"><i></i><div><b>Indigo</b><small>#6366F1</small></div><span>⌄</span></div>
      </section>
      <section class="prototype__group">
        <div class="prototype__section-title"><span>02</span><h2>Palette</h2><button type="button">↗</button></div>
        <div class="prototype__swatches"><div v-for="(color, index) in ['#eef2ff','#c7d2fe','#a5b4fc','#818cf8','#6366f1','#4f46e5','#4338ca','#3730a3']" :key="color" :style="{ background: color }"><small>{{ [50,100,200,400,500,600,700,800][index] }}</small></div></div>
        <div class="prototype__palette-label">Indigo <span>8 shades · generated</span></div>
      </section>
      <section class="prototype__group">
        <div class="prototype__section-title"><span>03</span><h2>Surfaces</h2><button type="button">↗</button></div>
        <div class="prototype__surface-row"><span>Canvas</span><i class="prototype__color-chip" style="background:#f4f4f5"></i><code>#F4F4F5</code><span>···</span></div>
        <div class="prototype__surface-row"><span>Sidebar</span><i class="prototype__color-chip" style="background:#ffffff"></i><code>#FFFFFF</code><span>···</span></div>
        <div class="prototype__surface-row"><span>Card</span><i class="prototype__color-chip" style="background:#ffffff"></i><code>#FFFFFF</code><span>···</span></div>
      </section>
      <section class="prototype__group prototype__type">
        <div class="prototype__section-title"><span>04</span><h2>Typography</h2><button type="button">↗</button></div>
        <div><span>Body</span><b>Inter</b><small>Aa Bb Cc 123</small></div>
        <div><span>Heading</span><b>Inter</b><small>Aa Bb Cc 123</small></div>
      </section>
      <section class="prototype__layout"><span>LAYOUT</span><b>Density</b><div><button type="button">Compact</button><button class="is-selected" type="button">Default</button><button type="button">Spacious</button></div></section>
    </section>

    <section class="prototype__preview" aria-label="Live demo preview">
      <div class="prototype__preview-caption"><span><i></i> LIVE DEMO</span><span>admin / dashboard <b>↗</b></span></div>
      <iframe :src="previewUrl" title="Filament preview" style="width: 100%; height: 100%; min-height: 0" />
    </section>

    <nav class="prototype__switcher" aria-label="Prototype variant switcher">
      <button type="button" aria-label="Previous variant" @click="stepVariant(-1)">←</button>
      <span><b>{{ activeVariant }}</b><span>{{ variantName }}</span></span>
      <div class="prototype__switcher-dots"><button v-for="variant in variants" :key="variant" type="button" :aria-label="`Variant ${variant}`" :aria-current="activeVariant === variant ? 'true' : undefined" @click="setVariant(variant)">{{ variant }}</button></div>
      <span class="prototype__keys">USE <kbd>←</kbd><kbd>→</kbd></span>
      <button type="button" aria-label="Next variant" @click="stepVariant(1)">→</button>
    </nav>
  </main>
</template>
