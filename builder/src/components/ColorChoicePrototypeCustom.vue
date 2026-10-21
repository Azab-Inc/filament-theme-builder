<script setup lang="ts">
defineProps<{ value: string; draft: string; canPickNative: boolean; valid: boolean }>()
const emit = defineEmits<{ select: [value: string]; 'update:draft': [value: string]; apply: [] }>()
</script>

<template>
  <div class="ccp-custom">
    <label
      >Native color<input
        type="color"
        :value="canPickNative ? value : '#000000'"
        :disabled="!canPickNative"
        aria-label="Native custom color"
        @input="emit('select', ($event.target as HTMLInputElement).value)"
    /></label>
    <p v-if="!canPickNative" class="ccp-hint">
      This token is preserved. Replace it explicitly below or choose a shade.
    </p>
    <label
      >Hex / CSS reference<input
        :value="draft"
        spellcheck="false"
        aria-label="Hex or CSS color value"
        @input="emit('update:draft', ($event.target as HTMLInputElement).value)"
    /></label>
    <p v-if="draft && !valid" class="ccp-invalid" role="status">
      Invalid color draft — current value is unchanged.
    </p>
    <button class="ccp-apply" :disabled="!valid" @click="emit('apply')">Apply custom value</button>
  </div>
</template>
