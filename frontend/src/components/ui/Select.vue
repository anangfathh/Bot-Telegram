<script setup>
import { cn } from '@/lib/utils'

defineProps({
  class: { type: String, default: '' },
  modelValue: { type: String, default: '' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <select
    :value="modelValue"
    :class="cn('flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3.5 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50', $props.class)"
    @change="$emit('update:modelValue', $event.target.value)"
  >
    <slot />
  </select>
</template>
