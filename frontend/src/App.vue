<template>
  <div class="min-h-screen bg-background text-foreground flex">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card shadow-sm transition-transform duration-300 lg:translate-x-0" :class="-isSidebarOpen ? '-translate-x-full' : 'translate-x-0'">
      <div class="flex h-14 items-center border-b px-6">
        <router-link to="/" class="flex items-center gap-2 font-semibold">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span class="text-lg">🤖</span>
          </div>
          <span>Mager Bot Admin</span>
        </router-link>
      </div>

      <div class="flex-1 overflow-y-auto py-4">
        <nav class="grid items-start px-4 text-sm font-medium lg:px-6 gap-y-1">
          <template v-for="group in navGroups" :key="group.title">
            <div class="mb-2 mt-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {{ group.title }}
            </div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
              active-class="bg-muted text-primary"
            >
              <component :is="item.icon" class="h-4 w-4" />
              {{ item.label }}
            </router-link>
          </template>
        </nav>
      </div>
      
      <!-- Footer Sidebar -->
      <div class="border-t p-4">
        <div class="flex items-center gap-3 px-2">
           <div class="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
             <span class="font-bold text-xs">A</span>
           </div>
           <div class="text-sm">
             <p class="font-medium">Administrator</p>
             <p class="text-xs text-muted-foreground">admin@bot.com</p>
           </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 lg:ml-64 flex flex-col min-h-screen">
      <!-- Header -->
      <header class="flex h-14 items-center gap-4 border-b bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <button class="lg:hidden" @click="isSidebarOpen = !isSidebarOpen">
          <Menu class="h-6 w-6" />
        </button>
        <div class="w-full flex-1">
          <!-- <form>
            <div class="relative">
              <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search resources..."
                class="w-full bg-background pl-8 md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form> -->
        </div>
        <div class="flex items-center gap-2">
           <Button variant="ghost" size="icon" @click="toggleTheme">
             <Moon v-if="isDark" class="h-5 w-5" />
             <Sun v-else class="h-5 w-5" />
           </Button>
        </div>
      </header>

      <!-- Main View -->
      <main class="flex-1 p-6 lg:p-8 pt-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { LayoutDashboard, Users, FileText, Star, Car, Menu, Sun, Moon, Search } from 'lucide-vue-next'
import { Input, Button } from '@/components/ui'
import { useDark, useToggle } from '@vueuse/core'

const isSidebarOpen = ref(true)

const isDark = useDark({
  selector: 'body',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
})
const toggleTheme = useToggle(isDark)

const navGroups = [
  {
    title: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    ]
  },
  {
    title: 'Management',
    items: [
      { path: '/users', label: 'Users', icon: Users },
      { path: '/posts', label: 'Posts', icon: FileText },
      { path: '/drivers', label: 'Drivers', icon: Car },
    ]
  },
  {
    title: 'Feedback',
    items: [
      { path: '/ratings', label: 'Ratings', icon: Star },
    ]
  }
]
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

