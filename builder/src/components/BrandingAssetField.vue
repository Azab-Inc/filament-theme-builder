<script setup lang="ts">
import type { BrandingAssetFieldEmits, BrandingAssetFieldProps } from './branding-asset-field.model'

const props = defineProps<BrandingAssetFieldProps>()
const emit = defineEmits<BrandingAssetFieldEmits>()
const fieldId = props.setting.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
const fileId = `brand-${fieldId}-file`
const referenceId = `brand-${fieldId}`
const errorId = `brand-${fieldId}-error`
</script>

<template>
  <label :for="referenceId">{{ label }} upload reference</label>
  <input :id="fileId" :name="fileId" type="file" accept="image/jpeg,image/png,image/webp" :aria-label="`Upload ${label.toLowerCase()}`" :aria-invalid="error ? 'true' : undefined" :aria-describedby="error ? errorId : undefined" @change="emit('upload', { setting, event: $event })" />
  <input :id="referenceId" :name="referenceId" autocomplete="off" spellcheck="false" :aria-label="`${label} upload reference`" :value="value ?? ''" @input="emit('update', { setting, value: ($event.target as HTMLInputElement).value || null })" />
  <span v-if="error" :id="errorId" role="alert">{{ error }}</span>
</template>
