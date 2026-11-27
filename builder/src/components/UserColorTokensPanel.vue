<script setup lang="ts">
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'
import type { UserTokens } from '@/models/user-tokens.model'
import type { ThemeMode } from '@/models/foundations.model'
import UserColorTokenControls from '@/components/UserColorTokenControls.vue'

const props = withDefaults(defineProps<{ tokens?: UserTokens; activeMode?: ThemeMode }>(), { activeMode: 'light' })
const store = useThemeStore()
const tokens = computed(() => props.tokens ?? store.theme.foundations.userTokens ?? { colors: {}, palettes: {} })
</script>

<template>
  <fieldset class="editor-control-surface palette-compact gap-3" data-user-color-tokens>
    <legend>Named palettes and color variables</legend>
    <UserColorTokenControls :tokens="tokens" :active-mode="activeMode" />
  </fieldset>
</template>
