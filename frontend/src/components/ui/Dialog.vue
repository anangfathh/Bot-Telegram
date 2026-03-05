<script setup>
import { cn } from '@/lib/utils'

defineProps({
  open: { type: Boolean, default: false },
  class: { type: String, default: '' },
})

defineEmits(['update:open'])
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50">
      <!-- Overlay -->
      <div 
        class="fixed inset-0 bg-foreground/30 backdrop-blur-sm"
        @click="$emit('update:open', false)"
      />
      <!-- Content -->
      <div :class="cn('fixed left-[50%] top-[50%] z-50 grid w-[calc(100%-1.5rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-2xl border border-border/80 bg-background p-6 shadow-xl duration-200', $props.class)">
        <slot />
        <button
          class="absolute right-4 top-4 rounded-md opacity-70 ring-offset-background transition-opacity hover:bg-secondary hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          @click="$emit('update:open', false)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          <span class="sr-only">Close</span>
        </button>
      </div>
    </div>
  </Teleport>
</template>
