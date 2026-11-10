<script setup lang="ts">
import { computed } from 'vue'
import ColorField from '@/components/ColorField.vue'
import { useThemeStore } from '@/stores/theme'
import { useColorFieldResets } from '@/composables/use-color-field-resets'
import type { FoundationsSurfaceControlsProps } from '@/dtos/foundations-surface-controls-props.dto'
import type { FoundationsSurfaceControlsEmits } from '@/dtos/foundations-surface-controls-emits.dto'

const props = defineProps<FoundationsSurfaceControlsProps>()
const emit = defineEmits<FoundationsSurfaceControlsEmits>()
const themeStore = useThemeStore()
const { resetKeys, resetField } = useColorFieldResets()
const groups = computed(() => [
  { key: 'surfaces', title: 'Surfaces', names: props.surfaceNames, values: props.surfaces, effective: props.effectiveFoundation?.surfaces },
  { key: 'borders', title: 'Borders', names: props.borderNames, values: props.borders, effective: props.effectiveFoundation?.borders },
  { key: 'text', title: 'Text', names: props.textNames, values: props.text, effective: props.effectiveFoundation?.text },
].map(group => ({ ...group, rows: Object.entries(group.values).filter(([name]) => group.names.some(item => item === name)).map(([name, value]) => ({
  name, value, path: `${group.key}.${name}`,
  effective: Object.entries(group.effective ?? {}).find(([key]) => key === name)?.[1] ?? value,
  id: group.key === 'surfaces' ? `${name}-surface` : `${group.key === 'borders' ? 'border' : 'text'}-${name}-${props.activeMode}`,
  label: group.key === 'surfaces' ? `${name} surface ${props.activeMode}` : `${group.key === 'borders' ? 'border' : 'text'} ${name} ${props.activeMode}`,
})) })))
function reset(path: string): void { resetField(path); emit('reset', path) }
</script>

<template>
  <fieldset class="surface-layout">
    <legend>Surfaces, borders, text, and modes</legend>
    <div class="surface-layout__groups">
      <section v-for="group in groups" :key="group.key" class="surface-layout__group">
        <h3 class="surface-layout__heading">{{ group.title }}</h3>
        <div class="surface-layout__rows">
          <div v-for="row in group.rows" :key="row.path" class="surface-layout__row">
            <ColorField :id="row.id" :label="row.label" :visible-label="row.label" :value="row.value" :effective-value="row.effective" profile="foundation" :context-key="`${contextKey ?? ''}:${activeMode}`" :status-id="`${row.id}-status`" :error-id="`${row.id}-error`" :error="foundationError(`${row.path}.${activeMode}`)" external-error :reset-key="resetKeys[`${row.path}.${activeMode}`]" :user-token-options="userTokenOptions" :mode-link="themeStore.bindingForModeTarget({ kind: 'foundation', path: row.path }, activeMode)" @input="emit('set-mode-value', { path: row.path, event: $event })" />
            <div class="surface-layout__meta"><span :id="`${row.id}-status`" role="status" aria-live="polite">{{ statusFor(row.path) }}</span><button type="button" :aria-label="`Reset ${row.label}`" @click="reset(`${row.path}.${activeMode}`)">Reset</button></div>
            <span v-if="foundationError(`${row.path}.${activeMode}`)" :id="`${row.id}-error`" :data-foundation-error="`${row.path}.${activeMode}`" role="alert">{{ foundationError(`${row.path}.${activeMode}`) }}</span>
          </div>
        </div>
      </section>
    </div>
  </fieldset>
</template>
