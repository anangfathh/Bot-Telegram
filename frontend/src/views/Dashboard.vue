<template>
  <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div>
        <h2 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Dashboard</h2>
        <p class="text-muted-foreground mt-1">Selamat datang kembali, Admin! Berikut ringkasan hari ini.</p>
      </div>
      <div class="flex items-center space-x-3">
        <Button @click="refreshStats" :disabled="loading" class="shadow-md hover:shadow-lg transition-all">
          <RefreshCcw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh Data
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card class="hover:shadow-md transition-all duration-300 border-l-4 border-l-blue-500 group">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Total Users</CardTitle>
          <div class="p-2 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors">
            <Users class="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ stats.users || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1 flex items-center"><span class="text-emerald-500 font-medium mr-1">Active</span> from telegram bot</p>
        </CardContent>
      </Card>

      <Card class="hover:shadow-md transition-all duration-300 border-l-4 border-l-emerald-500 group">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Active Posts</CardTitle>
          <div class="p-2 bg-emerald-500/10 rounded-full group-hover:bg-emerald-500/20 transition-colors">
            <FileText class="h-4 w-4 text-emerald-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ stats.posts?.active || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            <span class="font-medium text-foreground">{{ ((stats.posts?.active / (stats.posts?.total || 1)) * 100).toFixed(1) }}%</span> of total posts
          </p>
        </CardContent>
      </Card>

      <Card class="hover:shadow-md transition-all duration-300 border-l-4 border-l-amber-500 group">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Active Drivers</CardTitle>
          <div class="p-2 bg-amber-500/10 rounded-full group-hover:bg-amber-500/20 transition-colors">
            <Car class="h-4 w-4 text-amber-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ stats.drivers?.active || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            <span class="font-medium text-foreground">{{ stats.drivers?.total || 0 }}</span> drivers registered
          </p>
        </CardContent>
      </Card>

      <Card class="hover:shadow-md transition-all duration-300 border-l-4 border-l-purple-500 group">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Total Ratings</CardTitle>
          <div class="p-2 bg-purple-500/10 rounded-full group-hover:bg-purple-500/20 transition-colors">
            <Star class="h-4 w-4 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ stats.ratings || 0 }}</div>
          <p class="text-xs text-muted-foreground mt-1">Trusted feedback</p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
      <!-- Main Chart -->
      <Card class="col-span-4 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle class="text-lg font-bold">Overview</CardTitle>
          <CardDescription>Statistik aktivitas bot dalam 30 hari terakhir</CardDescription>
        </CardHeader>
        <CardContent class="pl-2">
          <div class="h-[350px] w-full">
            <Overview :stats="stats" v-if="!loading" />
            <div v-else class="flex h-full items-center justify-center">
              <Loader2 class="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity / Quick Actions -->
      <Card class="col-span-3 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle class="text-lg font-bold">Quick Actions</CardTitle>
          <CardDescription>Jalan pintas pengelolaan bot</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4">
            <Button variant="outline" class="w-full justify-start h-12 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" @click="$router.push('/drivers')">
              <div class="p-1.5 bg-muted rounded-md mr-3">
                <Car class="h-4 w-4" />
              </div>
              <span class="font-medium">Kelola Drivers</span>
            </Button>
            <Button variant="outline" class="w-full justify-start h-12 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" @click="$router.push('/posts')">
              <div class="p-1.5 bg-muted rounded-md mr-3">
                <FileText class="h-4 w-4" />
              </div>
              <span class="font-medium">Moderasi Postingan</span>
            </Button>
            <Button variant="outline" class="w-full justify-start h-12 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" @click="$router.push('/users')">
              <div class="p-1.5 bg-muted rounded-md mr-3">
                <Users class="h-4 w-4" />
              </div>
              <span class="font-medium">Cari Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button } from "@/components/ui";
import Overview from "@/components/Overview.vue";
import { Users, FileText, Car, Star, Activity, RefreshCcw, Loader2 } from "lucide-vue-next";
import { getStats } from "@/api";

const stats = ref({});
const loading = ref(true);

const fetchStats = async () => {
  loading.value = true;
  try {
    const response = await getStats();
    stats.value = response.data;
  } catch (error) {
    console.error("Failed to load stats:", error);
  } finally {
    loading.value = false;
  }
};

const refreshStats = () => {
  fetchStats();
};

onMounted(() => fetchStats());
</script>
