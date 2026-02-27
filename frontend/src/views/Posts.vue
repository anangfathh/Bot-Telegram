<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-3xl font-bold tracking-tight">Posts</h1>
      <p class="text-muted-foreground">Kelola post pengguna di channel</p>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4">
      <Select v-model="filter.category" class="w-48" @update:modelValue="fetchPosts(1)">
        <option value="">Semua Kategori</option>
        <option value="#ANJEM">ANJEM</option>
        <option value="#JASTIP">JASTIP</option>
        <option value="#OPENANJEM">OPENANJEM</option>
        <option value="#OPENJASTIP">OPENJASTIP</option>
      </Select>
      <Select v-model="filter.status" class="w-40" @update:modelValue="fetchPosts(1)">
        <option value="">Semua Status</option>
        <option value="active">Active</option>
        <option value="closed">Closed</option>
      </Select>
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
            <TableHead>User</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead class="max-w-[300px]">Message</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="post in posts" :key="post.id">
            <TableCell class="font-mono">{{ post.id }}</TableCell>
            <TableCell>{{ post.username || post.user_full_name || post.user_id }}</TableCell>
            <TableCell><Badge variant="secondary">{{ post.category }}</Badge></TableCell>
            <TableCell class="max-w-[300px] truncate">{{ post.message }}</TableCell>
            <TableCell>
              <Badge :variant="post.is_closed ? 'destructive' : 'success'">
                {{ post.is_closed ? 'Closed' : 'Active' }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(post.timestamp) }}</TableCell>
            <TableCell>
              <div class="flex gap-2">
                <Button v-if="!post.is_closed" variant="outline" size="sm" @click="closePost(post)">
                  Close
                </Button>
                <Button variant="destructive" size="sm" @click="confirmDelete(post)">
                  Delete
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="posts.length === 0">
            <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
              Belum ada post
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="fetchPosts(pagination.page - 1)">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="text-sm text-muted-foreground">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="fetchPosts(pagination.page + 1)">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteModal">
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Konfirmasi Hapus</h2>
        <p class="text-muted-foreground">Apakah Anda yakin ingin menghapus post ini?</p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showDeleteModal = false">Batal</Button>
          <Button variant="destructive" @click="deletePostConfirmed">Hapus</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Card, CardContent, Button, Badge, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog } from '@/components/ui'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getPosts, updatePost, deletePost } from '@/api'

const posts = ref([])
const loading = ref(true)
const error = ref(null)
const pagination = ref({ page: 1, totalPages: 1 })
const filter = reactive({ category: '', status: '' })
const showDeleteModal = ref(false)
const selectedPost = ref(null)

const fetchPosts = async (page = 1) => {
  loading.value = true
  try {
    const response = await getPosts({ page, limit: 20, category: filter.category, status: filter.status })
    posts.value = response.data.data
    pagination.value = response.data.pagination
  } catch (err) {
    error.value = 'Gagal memuat posts: ' + err.message
  } finally {
    loading.value = false
  }
}

const closePost = async (post) => {
  try {
    await updatePost(post.id, { is_closed: true })
    post.is_closed = 1
  } catch (err) {
    alert('Gagal menutup post: ' + err.message)
  }
}

const confirmDelete = (post) => {
  selectedPost.value = post
  showDeleteModal.value = true
}

const deletePostConfirmed = async () => {
  try {
    await deletePost(selectedPost.value.id)
    posts.value = posts.value.filter(p => p.id !== selectedPost.value.id)
    showDeleteModal.value = false
  } catch (err) {
    alert('Gagal menghapus post: ' + err.message)
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID')
}

onMounted(() => fetchPosts())
</script>
