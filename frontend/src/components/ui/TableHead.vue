<script setup>
import { cn } from '@/lib/utils'

defineProps({
  class: { type: String, default: '' }
})
</script>

<template>
  <th :class="cn('h-12 px-4 text-left align-middle text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground [&:has([role=checkbox])]:pr-0', $props.class)">
    <slot />
  </th>
</template>
