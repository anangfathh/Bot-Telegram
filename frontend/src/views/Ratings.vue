<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 class="font-display text-3xl font-semibold tracking-tight">Ratings</h1>
        <p class="text-muted-foreground mt-1">Lihat rating antar pengguna</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">Memuat data ratings...</p>
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="border-destructive/50 bg-destructive/5 shadow-sm">
      <CardContent class="pt-6 flex items-center text-destructive">
        <AlertCircle class="h-5 w-5 mr-2" />
        {{ error }}
      </CardContent>
    </Card>

    <!-- Data -->
    <template v-else>
      <div class="grid gap-3 md:hidden">
        <Card v-for="rating in ratings" :key="rating.id" class="p-4 shadow-sm border-muted-foreground/20">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold truncate">{{ rating.target_username ? "@" + rating.target_username : rating.target_full_name || rating.target_user_id }}</p>
              <p class="text-sm text-muted-foreground truncate">oleh {{ rating.rater_username ? "@" + rating.rater_username : rating.rater_full_name || rating.rated_by_user_id }}</p>
            </div>
            <span class="text-[11px] text-muted-foreground font-mono">#{{ rating.id }}</span>
          </div>
          <div class="mt-3 flex items-center gap-1 bg-yellow-500/10 w-fit px-2 py-1 rounded-full">
            <Star v-for="i in 5" :key="i" class="h-3.5 w-3.5" :class="i <= rating.score ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'" />
            <span class="ml-1 text-xs font-bold text-yellow-600 dark:text-yellow-500">{{ rating.score }}.0</span>
          </div>
          <p class="mt-3 text-sm text-muted-foreground italic line-clamp-3">"{{ rating.comment || "Tidak ada komentar" }}"</p>
          <p class="mt-2 text-xs text-muted-foreground">{{ formatDate(rating.created_at) }}</p>
        </Card>

        <Card v-if="ratings.length === 0" class="p-8 text-center text-muted-foreground border-muted-foreground/20">
          <div class="flex flex-col items-center justify-center">
            <Star class="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p>Belum ada rating yang diberikan</p>
          </div>
        </Card>
      </div>

      <Card class="hidden md:block overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader class="bg-muted/50">
              <TableRow class="hover:bg-transparent">
                <TableHead class="font-semibold">ID</TableHead>
                <TableHead class="font-semibold">Target User</TableHead>
                <TableHead class="font-semibold">Rated By</TableHead>
                <TableHead class="font-semibold">Score</TableHead>
                <TableHead class="font-semibold max-w-[300px]">Comment</TableHead>
                <TableHead class="font-semibold">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="rating in ratings" :key="rating.id" class="hover:bg-muted/30 transition-colors">
                <TableCell class="font-mono text-xs text-muted-foreground">{{ rating.id }}</TableCell>
                <TableCell class="font-medium">{{ rating.target_username ? "@" + rating.target_username : rating.target_full_name || rating.target_user_id }}</TableCell>
                <TableCell class="text-muted-foreground">{{ rating.rater_username ? "@" + rating.rater_username : rating.rater_full_name || rating.rated_by_user_id }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-1 bg-yellow-500/10 w-fit px-2 py-1 rounded-full">
                    <Star v-for="i in 5" :key="i" class="h-3.5 w-3.5" :class="i <= rating.score ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground/30'" />
                    <span class="ml-1 text-xs font-bold text-yellow-600 dark:text-yellow-500">{{ rating.score }}.0</span>
                  </div>
                </TableCell>
                <TableCell class="max-w-[300px] truncate text-muted-foreground italic" :title="rating.comment">"{{ rating.comment || "Tidak ada komentar" }}"</TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatDate(rating.created_at) }}</TableCell>
              </TableRow>
              <TableRow v-if="ratings.length === 0">
                <TableCell colspan="6" class="text-center py-12 text-muted-foreground">
                  <div class="flex flex-col items-center justify-center">
                    <Star class="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p>Belum ada rating yang diberikan</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </template>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-between rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm">
      <p class="text-sm text-muted-foreground hidden sm:block">
        Menampilkan halaman <span class="font-medium text-foreground">{{ pagination.page }}</span> dari <span class="font-medium text-foreground">{{ pagination.totalPages }}</span>
      </p>
      <div class="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
        <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="fetchRatings(pagination.page - 1)" class="hover:bg-primary/10 hover:text-primary"> <ChevronLeft class="h-4 w-4 mr-1" /> Prev </Button>
        <div class="flex items-center gap-1 px-2 sm:hidden">
          <span class="text-sm font-medium">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        </div>
        <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="fetchRatings(pagination.page + 1)" class="hover:bg-primary/10 hover:text-primary">
          Next <ChevronRight class="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Card, CardContent, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Loader2, Star, ChevronLeft, ChevronRight, AlertCircle } from "lucide-vue-next";
import { getRatings } from "@/api";

const ratings = ref([]);
const loading = ref(true);
const error = ref(null);
const pagination = ref({ page: 1, totalPages: 1 });

const fetchRatings = async (page = 1) => {
  loading.value = true;
  try {
    const response = await getRatings({ page, limit: 20 });
    ratings.value = response.data.data;
    pagination.value = response.data.pagination;
  } catch (err) {
    error.value = "Gagal memuat ratings: " + err.message;
  } finally {
    loading.value = false;
  }
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID");
};

onMounted(() => fetchRatings());
</script>
