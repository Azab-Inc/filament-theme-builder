<script setup lang="ts">
import { computed, ref } from 'vue'

const inherited = 'var(--gray-50)'
const value = ref(inherited)
const valid = ref('#f9fafb')
const source = ref<'inherited' | 'override'>('inherited')
const error = computed(() => {
  if (value.value === inherited || /^#[0-9a-f]{6}$/i.test(value.value)) return ''
  return value.value.startsWith('#') ? 'Enter a six-digit hex color.' : 'Choose the supported inherited token var(--gray-50) or a hex color.'
})
const overridden = computed(() => source.value === 'override')
function update() {
  if (value.value === inherited) { valid.value = '#f9fafb'; source.value = 'inherited' }
  if (/^#[0-9a-f]{6}$/i.test(value.value)) { valid.value = value.value; source.value = 'override' }
}
function reset() { value.value = inherited; valid.value = '#f9fafb'; source.value = 'inherited' }
</script>

<template>
  <section class="gp-shell"><header><b>Theme builder / Foundations / Surfaces</b><span>Token provenance stays visible while editing</span></header>
    <div class="gp-body"><aside><h1>Contextual color tokens</h1><p>Illustrative resolution for this prototype, not a universal CSS resolver.</p><div class="gp-token"><b>Page Surface</b><span class="gp-badge">{{ overridden ? 'Override' : 'Inherited' }}</span><code>{{ overridden ? 'Local hex value' : 'var(--gray-50)' }}</code><span class="gp-swatch" :style="{ background: valid }" data-testid="token-preview"></span><small>Resolved {{ valid }}</small></div></aside>
      <article><h2>Page Surface</h2><label for="page-surface">Page Surface</label><input id="page-surface" name="page-surface" autocomplete="off" spellcheck="false" v-model="value" :aria-invalid="error ? 'true' : 'false'" aria-describedby="page-surface-status" @input="update" /><p id="page-surface-status" :class="error ? 'gp-error' : 'gp-success'" role="status">{{ error || (overridden ? 'Override preview updates instantly.' : 'Using inherited value.') }}</p><button @click="reset">Reset to inherited</button></article></div>
  </section>
</template>
