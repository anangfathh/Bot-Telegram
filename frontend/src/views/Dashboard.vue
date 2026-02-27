<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between space-y-2">
      <div>
        <h2 class="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p class="text-muted-foreground">Selamat datang kembali, Admin!</p>
      </div>
      <div class="flex items-center space-x-2">
        <Button @click="refreshStats" :disabled="loading">
          <RefreshCcw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card class="hover:bg-accent/5 transition-colors">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Users</CardTitle>
          <Users class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.users || 0 }}</div>
          <p class="text-xs text-muted-foreground">+ from telegram bot</p>
        </CardContent>
      </Card>
      
      <Card class="hover:bg-accent/5 transition-colors">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Posts</CardTitle>
          <FileText class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.posts?.active || 0 }}</div>
          <p class="text-xs text-muted-foreground">
            {{ ((stats.posts?.active / (stats.posts?.total || 1)) * 100).toFixed(1) }}% of total posts
          </p>
        </CardContent>
      </Card>

      <Card class="hover:bg-accent/5 transition-colors">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Active Drivers</CardTitle>
          <Car class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.drivers?.active || 0 }}</div>
          <p class="text-xs text-muted-foreground">
            {{ stats.drivers?.total || 0 }} drivers registered
          </p>
        </CardContent>
      </Card>

      <Card class="hover:bg-accent/5 transition-colors">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">Total Ratings</CardTitle>
          <Star class="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ stats.ratings || 0 }}</div>
          <p class="text-xs text-muted-foreground">
            Trusted feedback
          </p>
        </CardContent>
      </Card>
    </div>

    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <!-- Main Chart -->
      <Card class="col-span-4">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent class="pl-2">
          <div class="h-[350px]">
            <Overview :stats="stats" v-if="!loading" />
            <div v-else class="flex h-full items-center justify-center">
              <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Activity / Quick Actions -->
      <Card class="col-span-3">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jalan pintas pengelolaan bot</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4">
             <Button variant="outline" class="w-full justify-start" @click="$router.push('/drivers')">
                <Car class="mr-2 h-4 w-4" />
                Kelola Drivers
             </Button>
             <Button variant="outline" class="w-full justify-start" @click="$router.push('/posts')">
                <FileText class="mr-2 h-4 w-4" />
                Moderasi Postingan
             </Button>
             <Button variant="outline" class="w-full justify-start" @click="$router.push('/users')">
                <Users class="mr-2 h-4 w-4" />
                Cari Users
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button } from '@/components/ui'
import Overview from '@/components/Overview.vue'
import { Users, FileText, Car, Star, Activity, RefreshCcw, Loader2 } from 'lucide-vue-next'
import { getStats } from '@/api'

const stats = ref({})
const loading = ref(true)

const fetchStats = async () => {
  loading.value = true
  try {
    const response = await getStats()
    stats.value = response.data
  } catch (error) {
    console.error('Failed to load stats:', error)
  } finally {
    loading.value = false
  }
}

const refreshStats = () => {
  fetchStats()
}

onMounted(() => fetchStats())
</script>

