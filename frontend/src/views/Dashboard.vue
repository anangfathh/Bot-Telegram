<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col items-start justify-between gap-4 xl:flex-row xl:items-center">
      <div>
        <h2 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Reporting overview</h2>
        <p class="mt-1.5 text-sm text-muted-foreground sm:text-base">Ringkasan performa bot dan aktivitas operasional terbaru.</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <Button variant="outline" class="h-10 rounded-xl border-border/80 bg-background px-4 text-sm font-semibold">
          <span class="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
          What's new?
        </Button>
        <Button variant="outline" class="h-10 rounded-xl border-border/80 bg-background px-4 text-sm font-semibold" @click="copyPageLink">
          <Copy class="mr-2 h-4 w-4" />
          {{ linkCopied ? "Copied" : "Copy link" }}
        </Button>
        <Button variant="outline" class="h-10 rounded-xl border-border/80 bg-background px-4 text-sm font-semibold" @click="openPreview">
          View site
          <ExternalLink class="ml-2 h-4 w-4" />
        </Button>
        <Button @click="refreshStats" :disabled="loading" class="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground">
          <RefreshCcw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />
          Refresh Data
        </Button>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card class="border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle class="text-sm font-semibold text-muted-foreground">Users</CardTitle>
          <div class="rounded-xl bg-secondary p-2">
            <Users class="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ formatNumber(stats.users) }}</div>
          <p class="mt-1 text-xs text-muted-foreground">Total user terdaftar dari Telegram bot.</p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle class="text-sm font-semibold text-muted-foreground">Posts</CardTitle>
          <div class="rounded-xl bg-secondary p-2">
            <FileText class="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ formatNumber(stats.posts?.active) }}</div>
          <p class="mt-1 text-xs text-muted-foreground">
            <span class="font-semibold text-foreground">{{ postActivePct }}</span> dari total {{ formatNumber(stats.posts?.total) }} postingan.
          </p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle class="text-sm font-semibold text-muted-foreground">Drivers</CardTitle>
          <div class="rounded-xl bg-secondary p-2">
            <Car class="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ formatNumber(stats.drivers?.active) }}</div>
          <p class="mt-1 text-xs text-muted-foreground">
            <span class="font-semibold text-foreground">{{ driverActivePct }}</span> driver aktif dari {{ formatNumber(stats.drivers?.total) }} terdaftar.
          </p>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle class="text-sm font-semibold text-muted-foreground">Ratings</CardTitle>
          <div class="rounded-xl bg-secondary p-2">
            <Star class="h-4 w-4 text-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div class="text-3xl font-bold tracking-tight">{{ formatNumber(stats.ratings) }}</div>
          <p class="mt-1 text-xs text-muted-foreground">Feedback rating yang tersimpan di sistem.</p>
        </CardContent>
      </Card>
    </div>

    <Card class="border-border/70 bg-card/95 shadow-sm">
      <CardHeader class="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle class="text-xl font-semibold tracking-tight">Website traffic</CardTitle>
          <CardDescription class="mt-1">Visualisasi tren performa berdasarkan data saat ini.</CardDescription>
        </div>
        <div class="inline-flex items-center gap-1 rounded-xl border border-border/70 bg-background/90 p-1">
          <button
            v-for="period in periods"
            :key="period"
            type="button"
            class="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
            :class="period === selectedPeriod ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'"
          >
            {{ period }}
          </button>
          <button type="button" class="rounded-lg border border-border/70 px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground">+</button>
        </div>
      </CardHeader>
      <CardContent class="pt-0">
        <div class="h-[320px] w-full">
          <Overview :stats="stats" v-if="!loading" />
          <div v-else class="flex h-full items-center justify-center">
            <Loader2 class="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-6 xl:grid-cols-7">
      <Card class="xl:col-span-5 border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="pb-3">
          <CardTitle class="text-xl font-semibold tracking-tight">Recently active</CardTitle>
          <CardDescription class="mt-1">Ringkasan komponen sistem yang paling sering dipakai.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="overflow-x-auto">
            <Table>
              <TableHeader class="bg-muted/40">
                <TableRow class="hover:bg-transparent">
                  <TableHead>Segment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead class="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="row in activityRows" :key="row.segment">
                  <TableCell class="font-medium">{{ row.segment }}</TableCell>
                  <TableCell>
                    <span class="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {{ row.status }}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div class="flex items-center gap-3">
                      <div class="h-2 w-28 rounded-full bg-muted">
                        <div class="h-2 rounded-full bg-foreground/80" :style="{ width: `${row.progress}%` }" />
                      </div>
                      <span class="text-xs font-medium text-muted-foreground">{{ row.progress }}%</span>
                    </div>
                  </TableCell>
                  <TableCell class="text-right font-semibold">{{ formatNumber(row.total) }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card class="xl:col-span-2 border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="pb-3">
          <CardTitle class="text-xl font-semibold tracking-tight">Quick actions</CardTitle>
          <CardDescription class="mt-1">Akses cepat ke menu pengelolaan.</CardDescription>
        </CardHeader>
        <CardContent class="pt-0">
          <div class="grid gap-4">
            <Button variant="outline" class="h-12 w-full justify-start rounded-xl border-border/70 bg-background hover:bg-secondary" @click="$router.push('/drivers')">
              <div class="mr-3 rounded-lg bg-secondary p-1.5">
                <Car class="h-4 w-4" />
              </div>
              <span class="font-medium">Kelola Drivers</span>
            </Button>
            <Button variant="outline" class="h-12 w-full justify-start rounded-xl border-border/70 bg-background hover:bg-secondary" @click="$router.push('/posts')">
              <div class="mr-3 rounded-lg bg-secondary p-1.5">
                <FileText class="h-4 w-4" />
              </div>
              <span class="font-medium">Moderasi Postingan</span>
            </Button>
            <Button variant="outline" class="h-12 w-full justify-start rounded-xl border-border/70 bg-background hover:bg-secondary" @click="$router.push('/users')">
              <div class="mr-3 rounded-lg bg-secondary p-1.5">
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
import { computed, onMounted, ref } from "vue";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import Overview from "@/components/Overview.vue";
import { Users, FileText, Car, Star, RefreshCcw, Loader2, Copy, ExternalLink } from "lucide-vue-next";
import { getStats } from "@/api";

const stats = ref({});
const loading = ref(true);
const linkCopied = ref(false);
const periods = ["12m", "30d", "7d", "24h", "Custom"];
const selectedPeriod = "Custom";

const calcPercent = (value = 0, total = 0) => {
  if (!total) return "0.0%";
  return `${((value / total) * 100).toFixed(1)}%`;
};

const formatNumber = (value = 0) => new Intl.NumberFormat("id-ID").format(value || 0);

const postActivePct = computed(() => calcPercent(stats.value.posts?.active || 0, stats.value.posts?.total || 0));
const driverActivePct = computed(() => calcPercent(stats.value.drivers?.active || 0, stats.value.drivers?.total || 0));

const activityRows = computed(() => {
  const postTotal = stats.value.posts?.total || 0;
  const postActive = stats.value.posts?.active || 0;
  const driverTotal = stats.value.drivers?.total || 0;
  const driverActive = stats.value.drivers?.active || 0;

  return [
    {
      segment: "Users",
      status: "Live",
      progress: 100,
      total: stats.value.users || 0,
    },
    {
      segment: "Posts",
      status: "Tracked",
      progress: postTotal ? Math.min(100, Math.round((postActive / postTotal) * 100)) : 0,
      total: postTotal,
    },
    {
      segment: "Drivers",
      status: "Tracked",
      progress: driverTotal ? Math.min(100, Math.round((driverActive / driverTotal) * 100)) : 0,
      total: driverTotal,
    },
    {
      segment: "Ratings",
      status: "Live",
      progress: 88,
      total: stats.value.ratings || 0,
    },
  ];
});

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

const copyPageLink = async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    linkCopied.value = true;
    setTimeout(() => {
      linkCopied.value = false;
    }, 1500);
  } catch (error) {
    console.error("Failed to copy page link:", error);
  }
};

const openPreview = () => {
  window.open("/", "_blank");
};

onMounted(() => fetchStats());
</script>
