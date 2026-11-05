<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { useGuidelinesPrototype } from '@/composables/use-guidelines-prototype'
import GuidelinesPrototypeSwitcher from '@/components/GuidelinesPrototypeSwitcher.vue'
import '@/styles/guidelines-prototype.css'
const state = useGuidelinesPrototype()
const views = { actions: defineAsyncComponent(() => import('@/components/GuidelinesActions.vue')), navigation: defineAsyncComponent(() => import('@/components/GuidelinesNavigation.vue')), tokens: defineAsyncComponent(() => import('@/components/GuidelinesTokens.vue')), keyboard: defineAsyncComponent(() => import('@/components/GuidelinesKeyboard.vue')), mobile: defineAsyncComponent(() => import('@/components/GuidelinesMobile.vue')) }
</script>
<template><main class="gp-root"><component :is="views[state.variant.value]" /><GuidelinesPrototypeSwitcher :variant="state.variant.value" :navigate="state.navigate" /></main></template>
