<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore } from '@/stores/theme'
import UserColorTokenRows from '@/components/UserColorTokenRows.vue'
import type { UserTokens } from '@/models/user-tokens.model'
import type { ThemeMode, PaletteShade } from '@/models/foundations.model'

const props = defineProps<{ tokens: UserTokens; activeMode: ThemeMode }>()
const store = useThemeStore()
const name = ref('')
const value = ref('#64748b')
const kind = ref<'color' | 'palette'>('color')
const error = ref('')
const success = ref('')
function create(): void {
  success.value = ''
  const result = kind.value === 'color' ? store.createUserColor(name.value, value.value) : store.createUserPalette(name.value, value.value)
  error.value = result.ok ? '' : result.error
  if (result.ok) { success.value = `Created ${result.name ?? 'token'}.`; name.value = '' }
}
function remove(token: string): void {
  success.value = ''
  const result = store.removeUserToken(token)
  error.value = result.ok ? '' : result.error
}
function update(token: string, event: Event, shade?: PaletteShade): void {
  success.value = ''
  const result = store.updateUserToken(token, (event.target as HTMLInputElement).value, props.activeMode, shade)
  error.value = result.ok ? '' : result.error
}
</script>

<template>
  <div class="grid min-w-0 gap-3">
    <p>Create reusable literal color definitions. Choose their references in color controls. Editing a seed regenerates that mode's eleven shades.</p>
    <div class="grid min-w-0 gap-3">
      <UserColorTokenRows :tokens="tokens" :active-mode="activeMode" @update="update" @remove="remove" />
      <div class="grid gap-2">
        <div class="grid grid-cols-3 gap-2">
          <label>Name<input v-model="name" autocomplete="off" autocapitalize="none" spellcheck="false" aria-describedby="user-token-name-hint" data-user-token-name /></label>
          <label>Type<select v-model="kind" data-user-token-kind><option value="color">Single color</option><option value="palette">11-shade palette</option></select></label>
          <label>Hex seed<input v-model="value" type="text" data-user-token-value /></label>
        </div>
        <p id="user-token-name-hint" class="text-sm">Names are trimmed and converted to lowercase. Use hyphens instead of spaces.</p>
        <button type="button" class="justify-self-start" data-user-token-create @click="create">Create token</button>
      </div>
    </div>
    <p v-if="error" role="alert" data-user-token-error>{{ error }}</p>
    <p v-if="success" role="status" aria-live="polite" data-user-token-success>{{ success }}</p>
  </div>
</template>
