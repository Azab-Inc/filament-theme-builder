<script setup lang="ts">
defineProps<{ label: string; name: string; value: string; error?: string }>()
const emit = defineEmits<{ reset: [] }>()
</script>

<template>
  <div class="db-field"><label :for="name">{{ label }}</label><slot :id="name" :field-name="name" /><small v-if="!error" class="db-source"><slot name="source" /></small><p v-if="error" :id="`${name}-error`" class="db-error" role="alert">{{ error }}</p><button type="button" class="db-reset" :aria-label="`Reset ${label}`" @click="emit('reset')">Reset</button></div>
</template>
