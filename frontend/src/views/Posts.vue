<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 class="font-display text-3xl font-semibold tracking-tight">Posts</h1>
        <p class="text-muted-foreground mt-1">Kelola post pengguna di channel</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-4 rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Filter class="h-4 w-4 text-muted-foreground hidden sm:block" />
        <Select v-model="filter.category" class="w-full sm:w-48" @update:modelValue="fetchPosts(1)">
          <option value="">Semua Kategori</option>
          <option value="#ANJEM">ANJEM</option>
          <option value="#JASTIP">JASTIP</option>
          <option value="#OPENANJEM">OPENANJEM</option>
          <option value="#OPENJASTIP">OPENJASTIP</option>
        </Select>
      </div>
      <Select v-model="filter.status" class="w-full sm:w-40" @update:modelValue="fetchPosts(1)">
        <option value="">Semua Status</option>
        <option value="active">Active</option>
        <option value="closed">Closed</option>
      </Select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">Memuat data posts...</p>
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
        <Card v-for="post in posts" :key="post.id" class="p-4 shadow-sm border-muted-foreground/20">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold truncate">{{ post.username ? "@" + post.username : post.user_full_name || post.user_id }}</p>
              <p class="text-xs text-muted-foreground mt-0.5">{{ formatDate(post.timestamp) }}</p>
            </div>
            <Badge :variant="post.is_closed ? 'destructive' : 'success'" class="shadow-sm">
              {{ post.is_closed ? "Closed" : "Active" }}
            </Badge>
          </div>
          <div class="mt-3 flex items-center justify-between gap-2">
            <Badge variant="secondary" class="bg-primary/10 text-primary border-transparent">
              {{ post.category }}
            </Badge>
            <span class="text-[11px] text-muted-foreground font-mono">#{{ post.id }}</span>
          </div>
          <p class="mt-3 text-sm text-muted-foreground line-clamp-3">{{ post.message }}</p>
          <div class="mt-3 flex gap-2">
            <Button v-if="!post.is_closed" variant="outline" size="sm" @click="closePost(post)" class="flex-1 hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/50">
              <XCircle class="h-3 w-3 mr-1" />
              Close
            </Button>
            <Button variant="destructive" size="sm" @click="confirmDelete(post)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card v-if="posts.length === 0" class="p-8 text-center text-muted-foreground border-muted-foreground/20">
          <div class="flex flex-col items-center justify-center">
            <FileText class="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p>Belum ada post yang ditemukan</p>
          </div>
        </Card>
      </div>

      <Card class="hidden md:block overflow-hidden border-border/70 bg-card/95 shadow-sm">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader class="bg-muted/50">
              <TableRow class="hover:bg-transparent">
                <TableHead class="font-semibold">ID</TableHead>
                <TableHead class="font-semibold">User</TableHead>
                <TableHead class="font-semibold">Kategori</TableHead>
                <TableHead class="font-semibold max-w-[300px]">Message</TableHead>
                <TableHead class="font-semibold">Status</TableHead>
                <TableHead class="font-semibold">Tanggal</TableHead>
                <TableHead class="font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="post in posts" :key="post.id" class="hover:bg-muted/30 transition-colors">
                <TableCell class="font-mono text-xs text-muted-foreground">{{ post.id }}</TableCell>
                <TableCell class="font-medium">{{ post.username ? "@" + post.username : post.user_full_name || post.user_id }}</TableCell>
                <TableCell>
                  <Badge variant="secondary" class="bg-primary/10 text-primary hover:bg-primary/20 border-transparent">
                    {{ post.category }}
                  </Badge>
                </TableCell>
                <TableCell class="max-w-[300px] truncate text-muted-foreground" :title="post.message">{{ post.message }}</TableCell>
                <TableCell>
                  <Badge :variant="post.is_closed ? 'destructive' : 'success'" class="shadow-sm">
                    {{ post.is_closed ? "Closed" : "Active" }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatDate(post.timestamp) }}</TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button v-if="!post.is_closed" variant="outline" size="sm" @click="closePost(post)" class="hover:bg-amber-500/10 hover:text-amber-500 hover:border-amber-500/50"> <XCircle class="h-3 w-3 mr-1" /> Close </Button>
                    <Button variant="destructive" size="sm" @click="confirmDelete(post)" class="shadow-sm">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="posts.length === 0">
                <TableCell colspan="7" class="text-center py-12 text-muted-foreground">
                  <div class="flex flex-col items-center justify-center">
                    <FileText class="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p>Belum ada post yang ditemukan</p>
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
        <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="fetchPosts(pagination.page - 1)" class="hover:bg-primary/10 hover:text-primary"> <ChevronLeft class="h-4 w-4 mr-1" /> Prev </Button>
        <div class="flex items-center gap-1 px-2 sm:hidden">
          <span class="text-sm font-medium">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        </div>
        <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="fetchPosts(pagination.page + 1)" class="hover:bg-primary/10 hover:text-primary"> Next <ChevronRight class="h-4 w-4 ml-1" /> </Button>
      </div>
    </div>

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteModal">
      <div class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight">Konfirmasi Hapus</h2>
        <p class="text-muted-foreground">Apakah Anda yakin ingin menghapus post ini?</p>
        <div class="flex justify-end gap-2 pt-2">
          <Button variant="outline" @click="showDeleteModal = false">Batal</Button>
          <Button variant="destructive" @click="deletePostConfirmed">Hapus</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Card, CardContent, Button, Badge, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog } from "@/components/ui";
import { Loader2, ChevronLeft, ChevronRight, Filter, AlertCircle, XCircle, Trash2, FileText } from "lucide-vue-next";
import { getPosts, updatePost, deletePost } from "@/api";

const posts = ref([]);
const loading = ref(true);
const error = ref(null);
const pagination = ref({ page: 1, totalPages: 1 });
const filter = reactive({ category: "", status: "" });
const showDeleteModal = ref(false);
const selectedPost = ref(null);

const fetchPosts = async (page = 1) => {
  loading.value = true;
  try {
    const response = await getPosts({ page, limit: 20, category: filter.category, status: filter.status });
    posts.value = response.data.data;
    pagination.value = response.data.pagination;
  } catch (err) {
    error.value = "Gagal memuat posts: " + err.message;
  } finally {
    loading.value = false;
  }
};

const closePost = async (post) => {
  try {
    await updatePost(post.id, { is_closed: true });
    post.is_closed = 1;
  } catch (err) {
    alert("Gagal menutup post: " + err.message);
  }
};

const confirmDelete = (post) => {
  selectedPost.value = post;
  showDeleteModal.value = true;
};

const deletePostConfirmed = async () => {
  try {
    await deletePost(selectedPost.value.id);
    posts.value = posts.value.filter((p) => p.id !== selectedPost.value.id);
    showDeleteModal.value = false;
  } catch (err) {
    alert("Gagal menghapus post: " + err.message);
  }
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID");
};

onMounted(() => fetchPosts());
</script>
