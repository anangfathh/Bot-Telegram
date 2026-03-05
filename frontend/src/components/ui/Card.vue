<script setup>
import { cn } from '@/lib/utils'

defineProps({
  class: { type: String, default: '' }
})
</script>

<template>
  <div :class="cn('rounded-2xl border border-border/80 bg-card text-card-foreground shadow-[0_2px_16px_-14px_rgba(15,23,42,0.45)]', $props.class)">
    <slot />
  </div>
</template>
