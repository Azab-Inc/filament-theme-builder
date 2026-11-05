<script setup lang="ts">
import { nextTick, ref } from 'vue'
import GuidelinesSampleDashboard from '@/components/GuidelinesSampleDashboard.vue'

const name = ref('Northstar admin')
const active = ref<'Foundations' | 'Components'>('Foundations')
const editor = ref<HTMLElement | null>(null)
const preview = ref<HTMLElement | null>(null)
async function select(section: 'Foundations' | 'Components') { active.value = section; await nextTick(); (section === 'Foundations' ? editor.value : preview.value)?.focus() }
</script>

<template>
  <section class="gp-shell"><a class="gp-skip" href="#gp-editor">Skip to editor</a><a class="gp-skip" href="#gp-preview">Skip to preview</a><header><b>Theme builder</b><span>Keyboard wayfinding prototype</span></header>
    <div class="gp-body"><aside><h1>Keyboard wayfinding</h1><p>Use Tab to move through sections. Focus rings show exactly where you are.</p><div class="gp-shortcuts"><kbd>Tab</kbd> move focus <kbd>Enter</kbd> activate a section</div></aside>
      <article><h2 id="gp-editor" ref="editor" tabindex="-1">Editor canvas</h2><label>Theme name<input v-model="name" /></label><nav aria-label="Editor sections"><a :aria-current="active === 'Foundations' ? 'page' : undefined" href="#gp-editor" @click.prevent="select('Foundations')">Foundations</a><a :aria-current="active === 'Components' ? 'page' : undefined" href="#gp-preview" @click.prevent="select('Components')">Components</a></nav><div id="gp-preview" ref="preview" class="gp-preview" tabindex="-1"><h2>Preview canvas</h2><GuidelinesSampleDashboard :theme-name="name" /></div></article></div>
  </section>
</template>
