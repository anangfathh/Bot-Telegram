<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Users</h1>
      <p class="text-muted-foreground">Kelola data pengguna bot</p>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4">
      <Input
        v-model="search"
        type="text"
        placeholder="Cari username atau nama..."
        class="max-w-sm"
        @input="debouncedSearch"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <Loader2 class="h-8 w-8 animate-spin text-primary" />
    </div>

    <!-- Error State -->
    <Card v-else-if="error" class="border-destructive">
      <CardContent class="pt-6 text-destructive">{{ error }}</CardContent>
    </Card>

    <!-- Table -->
    <Card v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Nama Lengkap</TableHead>
            <TableHead>Last Seen</TableHead>
            <TableHead>Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="user in users" :key="user.user_id">
            <TableCell class="font-mono">{{ user.user_id }}</TableCell>
            <TableCell>{{ user.username || '-' }}</TableCell>
            <TableCell>{{ user.full_name || user.first_name || '-' }}</TableCell>
            <TableCell>{{ formatDate(user.last_seen_at) }}</TableCell>
            <TableCell>{{ formatDate(user.created_at) }}</TableCell>
          </TableRow>
          <TableRow v-if="users.length === 0">
            <TableCell colspan="5" class="text-center py-8 text-muted-foreground">
              Belum ada data user
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="goToPage(pagination.page - 1)">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="text-sm text-muted-foreground">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="goToPage(pagination.page + 1)">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Card, CardContent, Input, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getUsers } from '@/api'

const users = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const pagination = ref({ page: 1, totalPages: 1 })

let debounceTimer = null

const fetchUsers = async (page = 1) => {
  loading.value = true
  try {
    const response = await getUsers({ page, limit: 20, search: search.value })
    users.value = response.data.data
    pagination.value = response.data.pagination
  } catch (err) {
    error.value = 'Gagal memuat users: ' + err.message
  } finally {
    loading.value = false
  }
}

const debouncedSearch = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchUsers(1), 300)
}

const goToPage = (page) => fetchUsers(page)

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID')
}

onMounted(() => fetchUsers())
</script>
