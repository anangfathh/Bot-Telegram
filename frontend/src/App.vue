<template>
  <div class="min-h-screen bg-background text-foreground flex font-sans selection:bg-primary/30">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-50 w-64 border-r bg-card/50 backdrop-blur-xl shadow-sm transition-transform duration-300 lg:translate-x-0" :class="-isSidebarOpen ? '-translate-x-full' : 'translate-x-0'">
      <div class="flex h-16 items-center border-b px-6 bg-gradient-to-r from-primary/10 to-transparent">
        <router-link to="/" class="flex items-center gap-3 font-bold tracking-tight">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md">
            <span class="text-xl">🤖</span>
          </div>
          <span class="bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">Mager Bot Admin</span>
        </router-link>
      </div>

      <div class="flex-1 overflow-y-auto py-6">
        <nav class="grid items-start px-4 text-sm font-medium lg:px-6 gap-y-1.5">
          <template v-for="group in navGroups" :key="group.title">
            <div class="mb-2 mt-6 px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              {{ group.title }}
            </div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-all hover:text-primary hover:bg-primary/10 group"
              active-class="bg-primary/15 text-primary font-semibold shadow-sm"
            >
              <component :is="item.icon" class="h-4 w-4 transition-transform group-hover:scale-110" />
              {{ item.label }}
            </router-link>
          </template>
        </nav>
      </div>

      <!-- Footer Sidebar -->
      <div class="border-t p-4 bg-card/50">
        <div class="flex items-center gap-3 px-2 rounded-xl p-2 hover:bg-muted/50 transition-colors cursor-pointer">
          <div class="h-9 w-9 rounded-full bg-gradient-to-br from-secondary to-secondary/50 flex items-center justify-center shadow-sm border">
            <span class="font-bold text-sm">A</span>
          </div>
          <div class="text-sm overflow-hidden">
            <p class="font-semibold truncate">Administrator</p>
            <p class="text-xs text-muted-foreground truncate">admin@bot.com</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- Main Content Wrapper -->
    <div class="flex-1 lg:ml-64 flex flex-col min-h-screen bg-muted/20">
      <!-- Header -->
      <header class="flex h-16 items-center gap-4 border-b bg-background/80 px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 shadow-sm">
        <button class="lg:hidden p-2 rounded-md hover:bg-muted transition-colors" @click="isSidebarOpen = !isSidebarOpen">
          <Menu class="h-5 w-5" />
        </button>
        <div class="w-full flex-1">
          <!-- Search placeholder -->
        </div>
        <div class="flex items-center gap-3">
          <Button variant="outline" size="icon" class="rounded-full h-9 w-9" @click="toggleTheme">
            <Moon v-if="isDark" class="h-4 w-4" />
            <Sun v-else class="h-4 w-4" />
          </Button>
        </div>
      </header>

      <!-- Main View -->
      <main class="flex-1 p-6 lg:p-8 pt-6 max-w-7xl mx-auto w-full">
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
import { ref } from "vue";
import { LayoutDashboard, Users, FileText, Star, Car, Menu, Sun, Moon, Search } from "lucide-vue-next";
import { Input, Button } from "@/components/ui";
import { useDark, useToggle } from "@vueuse/core";

const isSidebarOpen = ref(true);

const isDark = useDark({
  selector: "body",
  attribute: "class",
  valueDark: "dark",
  valueLight: "light",
});
const toggleTheme = useToggle(isDark);

const navGroups = [
  {
    title: "Overview",
    items: [{ path: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Management",
    items: [
      { path: "/users", label: "Users", icon: Users },
      { path: "/posts", label: "Posts", icon: FileText },
      { path: "/drivers", label: "Drivers", icon: Car },
    ],
  },
  {
    title: "Feedback",
    items: [{ path: "/ratings", label: "Ratings", icon: Star }],
  },
];
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
