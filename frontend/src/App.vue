<template>
  <router-view v-if="isAuthPage" />

  <div v-else class="min-h-screen bg-background p-3 text-foreground selection:bg-accent/60 sm:p-4">
    <div class="mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[1650px] overflow-hidden rounded-[30px] border border-border/70 bg-card/65 shadow-[0_18px_45px_-32px_rgba(15,23,42,0.35)] backdrop-blur-xl">
      <div v-if="isSidebarOpen" class="fixed inset-0 z-40 bg-foreground/15 backdrop-blur-[1px] lg:hidden" @click="isSidebarOpen = false" />

    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-[285px] shrink-0 flex-col border-r border-border/70 bg-card/90 px-5 py-5 backdrop-blur-xl transition-transform duration-300 lg:static lg:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="space-y-5">
        <router-link to="/" class="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/85 p-3.5 shadow-sm">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <span class="text-base font-bold">MB</span>
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-semibold tracking-tight">Mager Bot Admin</p>
            <p class="truncate text-xs text-muted-foreground">{{ adminLabel }}</p>
          </div>
        </router-link>

        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input class="h-10 rounded-xl border-border/80 bg-background pl-9 text-sm" placeholder="Search menu..." />
        </div>
      </div>

      <div class="mt-6 flex-1 overflow-y-auto pb-4">
        <nav class="space-y-5">
          <template v-for="group in navGroups" :key="group.title">
            <div class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {{ group.title }}
            </div>
            <router-link
              v-for="item in group.items"
              :key="item.path"
              :to="item.path"
              class="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-secondary/80 hover:text-foreground"
              active-class="bg-primary text-primary-foreground shadow-sm"
            >
              <component :is="item.icon" class="h-4 w-4 transition-transform group-hover:scale-105" />
              {{ item.label }}
            </router-link>
          </template>
        </nav>
      </div>

      <div class="mt-auto border-t border-border/70 pt-4">
        <div class="mb-2 grid gap-1">
          <button type="button" class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
            <Headset class="h-4 w-4" />
            Support
          </button>
          <button type="button" class="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground">
            <Settings class="h-4 w-4" />
            Settings
          </button>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-border/80 bg-background/85 p-2.5">
          <div class="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-secondary">
            <span class="font-bold text-sm">A</span>
          </div>
          <div class="flex-1 overflow-hidden text-sm">
            <p class="font-semibold truncate">Administrator</p>
            <p class="truncate text-xs text-muted-foreground">Online</p>
          </div>
          <Button variant="ghost" size="sm" class="h-8 px-2 hover:bg-secondary" @click="handleLogout">
            <LogOut class="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col bg-muted/35">
      <header class="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <button class="rounded-lg p-2 transition-colors hover:bg-secondary lg:hidden" @click="isSidebarOpen = !isSidebarOpen">
            <Menu class="h-5 w-5" />
          </button>
          <div>
            <p class="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Admin Control Center</p>
            <h1 class="font-display text-lg font-semibold tracking-tight">{{ pageTitle }}</h1>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="hidden rounded-xl border border-border/70 bg-card/90 px-3 py-2 text-xs font-medium text-muted-foreground lg:inline-flex">
            {{ currentDateLabel }}
          </span>
          <Button variant="outline" size="icon" class="h-10 w-10 rounded-xl border-border/80 bg-background" @click="toggleTheme">
            <Moon v-if="!isDark" class="h-4 w-4" />
            <Sun v-else class="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { LayoutDashboard, Users, FileText, Star, Car, Menu, Sun, Moon, LogOut, Search, Headset, Settings } from "lucide-vue-next";
import { Button, Input } from "@/components/ui";
import { useDark, useToggle } from "@vueuse/core";
import { logoutAdmin } from "@/api";
import { clearAuthSession, getAuthUser } from "@/auth";

const route = useRoute();
const router = useRouter();
const isSidebarOpen = ref(true);
const currentDateLabel = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date());

const isAuthPage = computed(() => route.meta.public === true);
const adminLabel = computed(() => getAuthUser()?.username || "admin");
const pageTitle = computed(() => (route.name ? String(route.name) : "Dashboard"));

const isDark = useDark({
  selector: "body",
  attribute: "class",
  valueDark: "dark",
  valueLight: "light",
});
const toggleTheme = useToggle(isDark);

onMounted(() => {
  isSidebarOpen.value = window.innerWidth >= 1024;
});

watch(
  () => route.fullPath,
  () => {
    if (window.innerWidth < 1024) {
      isSidebarOpen.value = false;
    }
  },
);

async function handleLogout() {
  try {
    await logoutAdmin();
  } catch (error) {
    console.error("Logout error:", error);
  } finally {
    clearAuthSession();
    router.push("/login");
  }
}

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
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
