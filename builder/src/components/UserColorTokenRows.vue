<script setup lang="ts">
import ColorField from '@/components/ColorField.vue'
import ModeValueLink from '@/components/ModeValueLink.vue'
import type { UserTokens } from '@/models/user-tokens.model'
import type { ThemeMode, PaletteShade } from '@/models/foundations.model'

defineProps<{ tokens: UserTokens; activeMode: ThemeMode }>()
const emit = defineEmits<{
  update: [token: string, event: Event, shade?: PaletteShade]
  remove: [token: string]
}>()
</script>

<template>
  <div class="grid min-w-0 gap-1.5">
    <details v-for="(color, token) in tokens.colors" :key="token" class="palette-accordion__item">
      <summary class="palette-accordion__header">
        <span class="palette-accordion__marker" :style="{ backgroundColor: color[activeMode] ?? color.light }" aria-hidden="true"></span>
        <span class="palette-accordion__name">{{ token }}</span>
        <span class="palette-accordion__base">{{ color[activeMode] ?? color.light }}</span>
        <span class="palette-accordion__summary">Single color · {{ activeMode }}</span>
      </summary>
      <div class="palette-accordion__panel">
        <div class="palette-accordion__base-editor">
          <ColorField :id="`user-color-${token}`" :label="`Named color ${token}`" :text-label="`Named color ${token}`" :visible-label="String(token)" :native-label="`${token} color picker`" :value="color[activeMode] ?? color.light" :effective-value="color[activeMode] ?? color.light" profile="hex68" :context-key="`${activeMode}:${token}`" @input="emit('update', token, $event)" />
          <ModeValueLink :target="{ kind: 'user-color', name: token }" />
        </div>
        <div class="flex flex-wrap items-center justify-between gap-2"><code>user.color.{{ token }}</code><button type="button" :aria-label="`Remove ${token}`" @click="emit('remove', token)">Remove</button></div>
      </div>
    </details>
    <details v-for="(palette, token) in tokens.palettes" :key="token" class="palette-accordion__item">
      <summary class="palette-accordion__header">
        <span class="palette-accordion__marker" :style="{ backgroundColor: palette.base[activeMode] ?? palette.base.light }" aria-hidden="true"></span>
        <span class="palette-accordion__name">{{ token }}</span>
        <span class="palette-accordion__base">{{ palette.base[activeMode] ?? palette.base.light }}</span>
        <span class="palette-accordion__ramp" aria-hidden="true">
          <span v-for="(color, shade) in palette.shades" :key="shade" :style="{ backgroundColor: color[activeMode] ?? color.light }" :title="`Shade ${shade}`"></span>
        </span>
        <span class="palette-accordion__summary">11 shades · {{ activeMode }}</span>
      </summary>
      <div class="palette-accordion__panel">
        <div class="palette-accordion__base-editor">
          <ColorField :id="`user-palette-${token}`" :label="`Named palette ${token} seed`" :text-label="`Named palette ${token} seed`" visible-label="Seed" :native-label="`${token} seed color picker`" :value="palette.base[activeMode] ?? palette.base.light" :effective-value="palette.base[activeMode] ?? palette.base.light" profile="hex68" :context-key="`${activeMode}:${token}:base`" @input="emit('update', token, $event)" />
          <ModeValueLink :target="{ kind: 'user-palette-base', name: token }" />
        </div>
        <div class="palette-accordion__shade-grid">
          <div v-for="(color, shade) in palette.shades" :key="shade" class="palette-accordion__shade">
            <span class="palette-accordion__shade-marker" :style="{ backgroundColor: color[activeMode] ?? color.light }" aria-hidden="true"></span>
            <ColorField :id="`user-${token}-${shade}`" :label="`${token} shade ${shade}`" :text-label="`${token} shade ${shade}`" :visible-label="String(shade)" :native-label="`${token} shade ${shade} color picker`" :value="color[activeMode] ?? color.light" :effective-value="color[activeMode] ?? color.light" profile="hex68" :context-key="`${activeMode}:${token}:${shade}`" @input="emit('update', token, $event, Number(shade) as PaletteShade)" />
            <ModeValueLink :target="{ kind: 'user-palette-shade', name: token, shade: Number(shade) as PaletteShade }" />
          </div>
        </div>
        <button type="button" class="justify-self-end" :aria-label="`Remove ${token}`" @click="emit('remove', token)">Remove</button>
      </div>
    </details>
  </div>
</template>
