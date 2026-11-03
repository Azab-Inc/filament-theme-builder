<script setup lang="ts">
import { computed, ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { UserTokens } from '@/models/user-tokens.model'
import type { ThemeMode } from '@/models/foundations.model'
import ModeValueLink from './ModeValueLink.vue'

const props = withDefaults(defineProps<{ tokens?: UserTokens; activeMode?: ThemeMode }>(), { activeMode: 'light' })
const store = useThemeStore()
const name = ref(''); const value = ref('#64748b'); const kind = ref<'color' | 'palette'>('color'); const error = ref('')
const success = ref('')
const tokens = computed(() => props.tokens ?? store.theme.foundations.userTokens ?? { colors: {}, palettes: {} })
function create(): void {
  success.value = ''
  const result = kind.value === 'color' ? store.createUserColor(name.value, value.value) : store.createUserPalette(name.value, value.value)
  error.value = result.ok ? '' : result.error
  if (result.ok) { success.value = `Created ${result.name ?? 'token'}.`; name.value = '' }
}
function remove(token: string): void { success.value = ''; const result = store.removeUserToken(token); error.value = result.ok ? '' : result.error }
function update(token: string, event: Event, shade?: import('@/models/foundations.model').PaletteShade): void {
  success.value = ''
  const result = store.updateUserToken(token, (event.target as HTMLInputElement).value, props.activeMode, shade)
  error.value = result.ok ? '' : result.error
}
</script>

<template>
  <fieldset class="grid gap-3 rounded-lg border border-zinc-200 p-4" data-user-color-tokens>
    <legend>Named palettes and color variables</legend>
    <p>Create reusable literal color definitions. Choose their references in color controls. Editing a seed regenerates that mode's eleven shades.</p>
    <div class="grid grid-cols-3 gap-2">
      <label>Name<input v-model="name" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="user-token-name-hint" data-user-token-name /></label>
      <label>Type<select v-model="kind" data-user-token-kind><option value="color">Single color</option><option value="palette">11-shade palette</option></select></label>
      <label>Hex seed<input v-model="value" type="text" data-user-token-value /></label>
    </div>
    <p id="user-token-name-hint" class="text-sm">Names are trimmed and converted to lowercase. Use hyphens instead of spaces.</p>
    <button type="button" data-user-token-create @click="create">Create token</button>
    <p v-if="error" role="alert" data-user-token-error>{{ error }}</p>
    <p v-if="success" role="status" aria-live="polite" data-user-token-success>{{ success }}</p>
    <div v-for="(color, token) in tokens.colors" :key="token" class="flex flex-wrap gap-2">
      <label>{{ token }} · {{ activeMode }}<input :aria-label="`Named color ${token}`" :value="color[activeMode] ?? color.light" @input="update(token, $event)" /></label>
      <code>user.color.{{ token }}</code><ModeValueLink :target="{ kind: 'user-color', name: token }" />
      <button type="button" :aria-label="`Remove ${token}`" @click="remove(token)">Remove</button>
    </div>
    <details v-for="(palette, token) in tokens.palettes" :key="token">
      <summary>{{ token }} palette · {{ activeMode }}</summary>
      <label>Seed<input :aria-label="`Named palette ${token} seed`" :value="palette.base[activeMode] ?? palette.base.light" @input="update(token, $event)" /></label>
      <ModeValueLink :target="{ kind: 'user-palette-base', name: token }" />
      <div v-for="(color, shade) in palette.shades" :key="shade" class="flex gap-2">
        <label>{{ shade }}<input :aria-label="`${token} shade ${shade}`" :value="color[activeMode] ?? color.light" @input="update(token, $event, Number(shade) as import('@/models/foundations.model').PaletteShade)" /></label>
        <ModeValueLink :target="{ kind: 'user-palette-shade', name: token, shade: Number(shade) as import('@/models/foundations.model').PaletteShade }" />
      </div>
      <button type="button" :aria-label="`Remove ${token}`" @click="remove(token)">Remove</button>
    </details>
  </fieldset>
</template>
