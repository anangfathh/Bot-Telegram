<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Users</h1>
        <p class="text-muted-foreground mt-1">Kelola data pengguna bot</p>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
      <div class="relative w-full max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input v-model="search" type="text" placeholder="Cari username atau nama..." class="pl-9 bg-background border-muted-foreground/20 focus-visible:ring-primary/50" @input="debouncedSearch" />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">Memuat data users...</p>
    </div>

    <!-- Error State -->
    <Card v-else-if="error" class="border-destructive/50 bg-destructive/5 shadow-sm">
      <CardContent class="pt-6 flex items-center text-destructive">
        <AlertCircle class="h-5 w-5 mr-2" />
        {{ error }}
      </CardContent>
    </Card>

    <!-- Data -->
    <template v-else>
      <div class="grid gap-3 md:hidden">
        <Card v-for="user in users" :key="user.user_id" class="p-4 shadow-sm border-muted-foreground/20">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-center gap-3 min-w-0">
              <div class="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold shrink-0">
                {{ user.username ? user.username.charAt(0).toUpperCase() : "?" }}
              </div>
              <div class="min-w-0">
                <p class="font-semibold truncate">{{ user.full_name || user.first_name || "Tanpa Nama" }}</p>
                <p class="text-sm text-muted-foreground truncate">{{ user.username ? "@" + user.username : "Tanpa username" }}</p>
              </div>
            </div>
            <span class="text-[11px] text-muted-foreground font-mono">#{{ user.user_id }}</span>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-md bg-muted/40 p-2">
              <p class="text-muted-foreground">Last Seen</p>
              <p class="font-medium mt-0.5">{{ formatDate(user.last_seen_at) }}</p>
            </div>
            <div class="rounded-md bg-muted/40 p-2">
              <p class="text-muted-foreground">Joined</p>
              <p class="font-medium mt-0.5">{{ formatDate(user.created_at) }}</p>
            </div>
          </div>
        </Card>

        <Card v-if="users.length === 0" class="p-8 text-center text-muted-foreground border-muted-foreground/20">
          <div class="flex flex-col items-center justify-center">
            <UsersIcon class="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p>Belum ada data user yang ditemukan</p>
          </div>
        </Card>
      </div>

      <Card class="hidden md:block shadow-sm overflow-hidden border-muted-foreground/20">
        <div class="overflow-x-auto">
          <Table>
            <TableHeader class="bg-muted/50">
              <TableRow class="hover:bg-transparent">
                <TableHead class="font-semibold">User ID</TableHead>
                <TableHead class="font-semibold">Username</TableHead>
                <TableHead class="font-semibold">Nama Lengkap</TableHead>
                <TableHead class="font-semibold">Last Seen</TableHead>
                <TableHead class="font-semibold">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="user in users" :key="user.user_id" class="hover:bg-muted/30 transition-colors">
                <TableCell class="font-mono text-xs text-muted-foreground">{{ user.user_id }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {{ user.username ? user.username.charAt(0).toUpperCase() : "?" }}
                    </div>
                    <span class="font-medium">{{ user.username ? "@" + user.username : "-" }}</span>
                  </div>
                </TableCell>
                <TableCell>{{ user.full_name || user.first_name || "-" }}</TableCell>
                <TableCell>
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                    {{ formatDate(user.last_seen_at) }}
                  </span>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatDate(user.created_at) }}</TableCell>
              </TableRow>
              <TableRow v-if="users.length === 0">
                <TableCell colspan="5" class="text-center py-12 text-muted-foreground">
                  <div class="flex flex-col items-center justify-center">
                    <UsersIcon class="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p>Belum ada data user yang ditemukan</p>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </Card>
    </template>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-between bg-card p-4 rounded-xl shadow-sm border">
      <p class="text-sm text-muted-foreground hidden sm:block">
        Menampilkan halaman <span class="font-medium text-foreground">{{ pagination.page }}</span> dari <span class="font-medium text-foreground">{{ pagination.totalPages }}</span>
      </p>
      <div class="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
        <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="goToPage(pagination.page - 1)" class="hover:bg-primary/10 hover:text-primary"> <ChevronLeft class="h-4 w-4 mr-1" /> Prev </Button>
        <div class="flex items-center gap-1 px-2 sm:hidden">
          <span class="text-sm font-medium">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        </div>
        <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="goToPage(pagination.page + 1)" class="hover:bg-primary/10 hover:text-primary"> Next <ChevronRight class="h-4 w-4 ml-1" /> </Button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Card, CardContent, Input, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { Loader2, ChevronLeft, ChevronRight, Search, AlertCircle, Users as UsersIcon } from "lucide-vue-next";
import { getUsers } from "@/api";

const users = ref([]);
const loading = ref(true);
const error = ref(null);
const search = ref("");
const pagination = ref({ page: 1, totalPages: 1 });

let debounceTimer = null;

const fetchUsers = async (page = 1) => {
  loading.value = true;
  try {
    const response = await getUsers({ page, limit: 20, search: search.value });
    users.value = response.data.data;
    pagination.value = response.data.pagination;
  } catch (err) {
    error.value = "Gagal memuat users: " + err.message;
  } finally {
    loading.value = false;
  }
};

const debouncedSearch = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchUsers(1), 300);
};

const goToPage = (page) => fetchUsers(page);

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID");
};

onMounted(() => fetchUsers());
</script>
