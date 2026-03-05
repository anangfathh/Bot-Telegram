<script setup>
import { cn } from '@/lib/utils'

defineProps({
  class: { type: String, default: '' }
})
</script>

<template>
  <tr :class="cn('border-b border-border/70 transition-colors hover:bg-muted/40 data-[state=selected]:bg-muted', $props.class)">
    <slot />
  </tr>
</template>
