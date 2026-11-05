<script setup lang="ts">
defineProps<{ themeName: string }>()
</script>

<template>
  <div class="gp-sample" aria-label="Local Filament-like sample dashboard">
    <div class="gp-sample-head"><b>{{ themeName }}</b><small>LOCAL SAMPLE · NOT WIRED TO EDITS</small></div>
    <div class="gp-metrics"><div><small>Revenue</small><strong>$24,680</strong></div><div><small>Orders</small><strong>184</strong></div><div><small>Customers</small><strong>1,284</strong></div></div>
    <div class="gp-order"><span><b>Recent order</b><small>#1048 · 2 minutes ago</small></span><strong>$128.00</strong><button type="button">View order</button></div>
  </div>
</template>
