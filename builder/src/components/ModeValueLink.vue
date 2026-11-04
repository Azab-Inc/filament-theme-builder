<script setup lang="ts">
import { computed, inject } from 'vue'
import type { ModeLinkBinding } from '@/models/mode-link-control.model'
import type { ModeLinkTarget } from '@/models/mode-link-target.model'
import ModeLinkControl from './ModeLinkControl.vue'
const props = defineProps<{ target?: ModeLinkTarget }>()
const factory = inject<((target: ModeLinkTarget) => ModeLinkBinding) | null>('mode-link-binding', null)
const binding = computed(() => props.target && factory ? factory(props.target) : null)
</script>

<template><ModeLinkControl v-if="binding" :binding="binding" /></template>
