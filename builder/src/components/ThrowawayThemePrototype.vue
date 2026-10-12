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

<style scoped>
.prototype{--ink:#25251f;--muted:#88877f;--line:#e8e7e1;--paper:#faf9f6;position:relative;display:flex;height:100vh;min-height:540px;overflow:hidden;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,sans-serif}.prototype__toolbar{position:absolute;z-index:2;inset:0 0 auto;height:58px;display:flex;align-items:center;justify-content:space-between;padding:0 25px;border-bottom:1px solid var(--line);background:#faf9f6}.prototype__brand,.prototype__context,.prototype__toolbar-actions{display:flex;align-items:center;gap:10px;font-size:12px}.prototype__brand{font-size:13px}.prototype__brand b{font-weight:500;color:#77766e}.prototype__mark{display:grid;place-items:center;width:25px;height:25px;background:#292922;color:white;border-radius:7px;font-family:Georgia,serif;font-size:17px}.prototype__live-dot,.prototype__preview-caption i{width:7px;height:7px;border-radius:50%;background:#57a47d}.prototype__divider{color:#c4c3bd}.prototype__saved{font-size:10px;color:#85847c}.prototype__toolbar button{height:30px;border:1px solid var(--line);border-radius:6px;padding:0 11px;background:transparent;font-size:11px}.prototype__toolbar .prototype__publish{background:#292922;color:white;border-color:#292922}.prototype__editor{position:relative;box-sizing:border-box;overflow:auto;padding:88px 34px 88px}.prototype__eyebrow{font-size:9px;letter-spacing:.13em;color:#94938a}.prototype__eyebrow span{margin-left:14px;color:#b5b4ac}.prototype__editor h1{font:400 34px/1.04 Georgia,serif;letter-spacing:-.04em;margin:19px 0 9px}.prototype__editor h1 em{font-weight:400;color:#837f70}.prototype__intro{max-width:300px;margin:0 0 26px;font-size:10px;line-height:1.7;color:#8f8e85}.prototype__group{border-top:1px solid var(--line);padding:13px 0 16px}.prototype__section-title{display:flex;align-items:center;gap:9px;margin-bottom:11px}.prototype__section-title>span{font:10px Georgia,serif;color:#a8a69c}.prototype__section-title h2{font-size:12px;font-weight:550;margin:0;flex:1}.prototype__section-title button{border:0;background:transparent;color:#a7a59b}.prototype__primary{display:flex;align-items:center;gap:10px;padding:8px;border:1px solid var(--line);border-radius:6px;background:#fff}.prototype__primary>i{width:25px;height:25px;background:#6366f1;border-radius:5px}.prototype__primary div{display:grid;gap:2px;flex:1}.prototype__primary b{font-size:11px;font-weight:550}.prototype__primary small,.prototype__palette-label span{font-size:9px;color:#929189}.prototype__primary>span{color:#999}.prototype__swatches{display:grid;grid-template-columns:repeat(8,1fr);height:39px;border-radius:5px;overflow:hidden}.prototype__swatches div{position:relative}.prototype__swatches small{position:absolute;bottom:3px;left:3px;font-size:6px;color:#29292288}.prototype__palette-label{display:flex;justify-content:space-between;margin-top:7px;font-size:10px}.prototype__surface-row{height:29px;display:flex;align-items:center;border-bottom:1px solid #eeede8;font-size:9px}.prototype__surface-row span:first-child{flex:1}.prototype__surface-row code{font-size:8px;color:#85847b;margin:0 12px}.prototype__surface-row>span:last-child{color:#aaa}.prototype__color-chip{height:14px;width:14px;border:1px solid #e7e6e0;border-radius:4px}.prototype__type>div:not(.prototype__section-title){display:grid;grid-template-columns:1fr 1fr 1.5fr;align-items:center;border-bottom:1px solid #eeede8;padding:8px 0;font-size:9px;color:#777}.prototype__type b{font-size:10px;color:#333;font-weight:500}.prototype__type small{text-align:right;font-size:11px}.prototype__layout{padding:13px 0 25px;border-top:1px solid var(--line);display:grid;gap:10px}.prototype__layout>span{font-size:9px;letter-spacing:.13em;color:#929189}.prototype__layout>b{font-size:11px;font-weight:500}.prototype__layout>div{display:flex}.prototype__layout button{flex:1;padding:7px 2px;border:1px solid var(--line);background:transparent;font-size:9px;color:#777;border-right:0}.prototype__layout button:first-child{border-radius:5px 0 0 5px}.prototype__layout button:last-child{border-right:1px solid var(--line);border-radius:0 5px 5px 0}.prototype__layout button.is-selected{background:#292922;color:white;border-color:#292922}.prototype__preview{box-sizing:border-box;display:flex;flex:1;min-width:0;flex-direction:column;padding:78px 24px 54px;background:#eeede8}.prototype__preview-caption{height:30px;display:flex;justify-content:space-between;align-items:center;color:#85847b;font-size:9px;letter-spacing:.08em}.prototype__preview-caption>span{display:flex;align-items:center;gap:8px}.prototype__preview-caption b{font-size:12px}iframe{display:block;flex:1;min-height:0;width:100%;border:1px solid #deddd6;border-radius:8px;background:white;box-shadow:0 8px 30px #39382c12}.prototype__switcher{position:absolute;z-index:3;bottom:15px;left:50%;transform:translateX(-50%);height:42px;display:flex;align-items:center;gap:12px;padding:0 9px;background:#292922;color:white;border-radius:9px;box-shadow:0 5px 18px #17171230}.prototype__switcher>button{width:26px;height:26px;border:0;border-radius:5px;color:white;background:#ffffff16;font-size:16px}.prototype__switcher>span:nth-child(2){display:grid;gap:1px;min-width:102px}.prototype__switcher>span:nth-child(2) b{font-size:10px}.prototype__switcher>span:nth-child(2) span{font-size:8px;color:#aaa99f}.prototype__switcher-dots{display:flex;gap:3px}.prototype__switcher-dots button{width:23px;height:24px;border:0;border-radius:5px;background:transparent;color:#aaa99f;font-size:9px}.prototype__switcher-dots button[aria-current=true]{background:#ffffff20;color:white}.prototype__keys{display:flex;align-items:center;gap:4px;font-size:7px;letter-spacing:.08em;color:#aaa99f}.prototype__keys kbd{font:9px inherit;border:1px solid #ffffff30;border-radius:3px;padding:2px 4px}.prototype--a .prototype__editor{width:410px;flex:none;border-right:1px solid var(--line)}.prototype--b{display:flex;flex-direction:column;padding-top:58px}.prototype--b .prototype__toolbar{top:0}.prototype--b .prototype__editor{order:0;flex:none;width:100%;height:244px;overflow:hidden;padding:20px 28px 18px;display:grid;grid-template-columns:1.05fr 1.1fr 1.2fr 1.25fr 1.1fr;gap:22px;align-items:center}.prototype--b .prototype__eyebrow{position:absolute;top:10px;left:28px}.prototype--b .prototype__editor h1{font-size:23px;margin:0}.prototype--b .prototype__intro{display:none}.prototype--b .prototype__group{padding:0;border-top:0;min-width:0}.prototype--b .prototype__section-title{margin-bottom:8px}.prototype--b .prototype__layout{border-top:0;padding:0}.prototype--b .prototype__preview{min-height:0;flex:1;padding:0 28px 55px}.prototype--b .prototype__preview-caption{height:30px}.prototype--c .prototype__toolbar{left:310px;padding-left:18px}.prototype--c .prototype__editor{position:absolute;z-index:1;top:78px;bottom:75px;left:18px;width:280px;padding:21px 21px 75px;background:#faf9f6f5;border:1px solid #e4e3dc;border-radius:10px;box-shadow:0 10px 36px #28271e18}.prototype--c .prototype__editor h1{font-size:26px;margin:14px 0 8px}.prototype--c .prototype__intro{font-size:9px;margin-bottom:15px}.prototype--c .prototype__group{padding:9px 0}.prototype--c .prototype__preview{padding:70px 20px 54px 315px;background:#eeede8}.prototype--c .prototype__preview-caption{height:26px}@media(max-width:850px){.prototype--a .prototype__editor{width:340px;padding-left:22px;padding-right:22px}.prototype--b .prototype__editor{grid-template-columns:repeat(3,1fr);height:310px}.prototype--b .prototype__group:nth-of-type(4){display:none}.prototype--c .prototype__toolbar{left:250px}.prototype--c .prototype__editor{left:10px;width:220px;padding:16px}.prototype--c .prototype__preview{padding-left:245px}.prototype__brand{font-size:10px}.prototype__toolbar{padding:0 14px}.prototype__context{display:none}}@media(max-width:600px){.prototype{min-height:0}.prototype--a{flex-direction:column}.prototype--a .prototype__editor{width:100%;height:44%;padding:70px 18px 18px}.prototype--a .prototype__preview{min-height:35%;padding:6px 12px 52px}.prototype--b .prototype__editor{height:320px;grid-template-columns:repeat(2,1fr);overflow:auto}.prototype--c .prototype__editor{top:72px;left:8px;width:190px;bottom:66px}.prototype--c .prototype__preview{padding-left:211px;padding-right:8px}.prototype__toolbar-actions .prototype__saved,.prototype__toolbar-actions>button:first-of-type{display:none}.prototype__switcher{gap:6px}.prototype__switcher>span:nth-child(2){min-width:78px}}
</style>
