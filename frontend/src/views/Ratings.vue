<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Ratings</h1>
      <p class="text-muted-foreground">Lihat rating antar pengguna</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Error -->
    <Card v-else-if="error" class="border-destructive">
      <CardContent class="pt-6 text-destructive">{{ error }}</CardContent>
    </Card>

    <!-- Table -->
    <Card v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Target User</TableHead>
            <TableHead>Rated By</TableHead>
            <TableHead>Score</TableHead>
            <TableHead class="max-w-[300px]">Comment</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="rating in ratings" :key="rating.id">
            <TableCell class="font-mono">{{ rating.id }}</TableCell>
            <TableCell>{{ rating.target_username || rating.target_full_name || rating.target_user_id }}</TableCell>
            <TableCell>{{ rating.rater_username || rating.rater_full_name || rating.rated_by_user_id }}</TableCell>
            <TableCell>
              <div class="flex items-center gap-1">
                <Star v-for="i in 5" :key="i" class="h-4 w-4" :class="i <= rating.score ? 'fill-yellow-400 text-yellow-400' : 'text-muted'" />
              </div>
            </TableCell>
            <TableCell class="max-w-[300px] truncate">{{ rating.comment || '-' }}</TableCell>
            <TableCell>{{ formatDate(rating.created_at) }}</TableCell>
          </TableRow>
          <TableRow v-if="ratings.length === 0">
            <TableCell colspan="6" class="text-center py-8 text-muted-foreground">
              Belum ada rating
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="fetchRatings(pagination.page - 1)">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="text-sm text-muted-foreground">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="fetchRatings(pagination.page + 1)">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Card, CardContent, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { Loader2, Star, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getRatings } from '@/api'

const ratings = ref([])
const loading = ref(true)
const error = ref(null)
const pagination = ref({ page: 1, totalPages: 1 })

const fetchRatings = async (page = 1) => {
  loading.value = true
  try {
    const response = await getRatings({ page, limit: 20 })
    ratings.value = response.data.data
    pagination.value = response.data.pagination
  } catch (err) {
    error.value = 'Gagal memuat ratings: ' + err.message
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID')
}

onMounted(() => fetchRatings())
</script>
