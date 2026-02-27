<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
      <div>
        <h1 class="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">Drivers</h1>
        <p class="text-muted-foreground mt-1">Kelola data driver</p>
      </div>
      <Button @click="openAddModal" class="shadow-md hover:shadow-lg transition-all">
        <Plus class="mr-2 h-4 w-4" />
        Tambah Driver
      </Button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4 bg-card p-4 rounded-xl shadow-sm border">
      <div class="flex items-center gap-2 w-full sm:w-auto">
        <Filter class="h-4 w-4 text-muted-foreground hidden sm:block" />
        <Select v-model="filter.status" class="w-full sm:w-48" @update:modelValue="fetchDrivers(1)">
          <option value="">Semua Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground animate-pulse">Memuat data drivers...</p>
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
        <Card v-for="driver in drivers" :key="driver.user_id" class="p-4 shadow-sm border-muted-foreground/20">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold truncate">{{ driver.full_name || driver.username || "Tanpa Nama" }}</p>
              <p class="text-sm text-muted-foreground truncate">{{ driver.username ? "@" + driver.username : "Tanpa username" }}</p>
            </div>
            <Badge :variant="driver.status === 'active' ? 'success' : 'destructive'" class="shadow-sm">
              {{ driver.status }}
            </Badge>
          </div>
          <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div class="rounded-md bg-muted/40 p-2">
              <p class="text-muted-foreground">Joined</p>
              <p class="font-medium mt-0.5">{{ formatDate(driver.joined_at) }}</p>
            </div>
            <div class="rounded-md bg-muted/40 p-2">
              <p class="text-muted-foreground">Expires</p>
              <p :class="isExpired(driver.expires_at) ? 'font-medium text-destructive' : 'font-medium mt-0.5'">{{ formatDate(driver.expires_at) }}</p>
            </div>
          </div>
          <p class="mt-2 text-[11px] text-muted-foreground font-mono">ID: {{ driver.user_id }}</p>
          <div class="mt-3 flex gap-2">
            <Button variant="outline" size="sm" @click="openRenewModal(driver)" class="flex-1 hover:bg-primary/10 hover:text-primary">
              <RefreshCw class="mr-1 h-3 w-3" />
              Renew
            </Button>
            <Button variant="destructive" size="sm" @click="confirmDelete(driver)">
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </Card>

        <Card v-if="drivers.length === 0" class="p-8 text-center text-muted-foreground border-muted-foreground/20">
          <div class="flex flex-col items-center justify-center">
            <Car class="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p>Belum ada data driver yang ditemukan</p>
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
                <TableHead class="font-semibold">Nama</TableHead>
                <TableHead class="font-semibold">Status</TableHead>
                <TableHead class="font-semibold">Joined</TableHead>
                <TableHead class="font-semibold">Expires</TableHead>
                <TableHead class="font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="driver in drivers" :key="driver.user_id" class="hover:bg-muted/30 transition-colors">
                <TableCell class="font-mono text-xs text-muted-foreground">{{ driver.user_id }}</TableCell>
                <TableCell>
                  <div class="flex items-center gap-2">
                    <div class="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {{ driver.username ? driver.username.charAt(0).toUpperCase() : "?" }}
                    </div>
                    <span class="font-medium">{{ driver.username ? "@" + driver.username : "-" }}</span>
                  </div>
                </TableCell>
                <TableCell>{{ driver.full_name || "-" }}</TableCell>
                <TableCell>
                  <Badge :variant="driver.status === 'active' ? 'success' : 'destructive'" class="shadow-sm">
                    {{ driver.status }}
                  </Badge>
                </TableCell>
                <TableCell class="text-muted-foreground text-sm">{{ formatDate(driver.joined_at) }}</TableCell>
                <TableCell :class="isExpired(driver.expires_at) ? 'text-destructive font-medium' : 'text-muted-foreground text-sm'">
                  {{ formatDate(driver.expires_at) }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button variant="outline" size="sm" @click="openRenewModal(driver)" class="hover:bg-primary/10 hover:text-primary">
                      <RefreshCw class="mr-1 h-3 w-3" />
                      Renew
                    </Button>
                    <Button variant="destructive" size="sm" @click="confirmDelete(driver)" class="shadow-sm">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="drivers.length === 0">
                <TableCell colspan="7" class="text-center py-12 text-muted-foreground">
                  <div class="flex flex-col items-center justify-center">
                    <Car class="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p>Belum ada data driver yang ditemukan</p>
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
        <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="fetchDrivers(pagination.page - 1)" class="hover:bg-primary/10 hover:text-primary"> <ChevronLeft class="h-4 w-4 mr-1" /> Prev </Button>
        <div class="flex items-center gap-1 px-2 sm:hidden">
          <span class="text-sm font-medium">{{ pagination.page }} / {{ pagination.totalPages }}</span>
        </div>
        <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="fetchDrivers(pagination.page + 1)" class="hover:bg-primary/10 hover:text-primary">
          Next <ChevronRight class="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>

    <!-- Add Driver Dialog -->
    <Dialog v-model:open="showAddModal">
      <div class="space-y-4">
        <h2 class="text-xl font-bold tracking-tight">Tambah Driver Baru</h2>
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">User ID *</label>
            <Input v-model="newDriver.user_id" type="number" placeholder="Masukkan User ID" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Username</label>
            <Input v-model="newDriver.username" placeholder="@username" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Nama Lengkap</label>
            <Input v-model="newDriver.full_name" placeholder="Nama lengkap" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium">Durasi (hari)</label>
            <Input v-model="newDriver.duration_days" type="number" placeholder="30" />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showAddModal = false">Batal</Button>
          <Button @click="addDriver">Simpan</Button>
        </div>
      </div>
    </Dialog>

    <!-- Renew Dialog -->
    <Dialog v-model:open="showRenewModal">
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Perpanjang Driver</h2>
        <p class="text-muted-foreground">
          Perpanjang masa aktif untuk: <strong>{{ selectedDriver?.username || selectedDriver?.full_name || selectedDriver?.user_id }}</strong>
        </p>
        <div class="space-y-2">
          <label class="text-sm font-medium">Tambah Durasi (hari)</label>
          <Input v-model="renewDays" type="number" placeholder="30" />
        </div>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showRenewModal = false">Batal</Button>
          <Button @click="renewDriver">Perpanjang</Button>
        </div>
      </div>
    </Dialog>

    <!-- Delete Dialog -->
    <Dialog v-model:open="showDeleteModal">
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Konfirmasi Hapus</h2>
        <p class="text-muted-foreground">
          Apakah Anda yakin ingin menghapus driver <strong>{{ selectedDriver?.username || selectedDriver?.full_name || selectedDriver?.user_id }}</strong
          >?
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="showDeleteModal = false">Batal</Button>
          <Button variant="destructive" @click="deleteDriverConfirmed">Hapus</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { Card, CardContent, Button, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog } from "@/components/ui";
import { Loader2, Plus, RefreshCw, Trash2, ChevronLeft, ChevronRight, Filter, Car, AlertCircle } from "lucide-vue-next";
import { getDrivers, createDriver, updateDriver, deleteDriver } from "@/api";

const drivers = ref([]);
const loading = ref(true);
const error = ref(null);
const pagination = ref({ page: 1, totalPages: 1 });
const filter = reactive({ status: "" });

const showAddModal = ref(false);
const showRenewModal = ref(false);
const showDeleteModal = ref(false);
const selectedDriver = ref(null);
const renewDays = ref(30);

const newDriver = reactive({
  user_id: "",
  username: "",
  full_name: "",
  duration_days: 30,
});

const fetchDrivers = async (page = 1) => {
  loading.value = true;
  try {
    const response = await getDrivers({ page, limit: 20, status: filter.status });
    drivers.value = response.data.data;
    pagination.value = response.data.pagination;
  } catch (err) {
    error.value = "Gagal memuat drivers: " + err.message;
  } finally {
    loading.value = false;
  }
};

const openAddModal = () => {
  Object.assign(newDriver, { user_id: "", username: "", full_name: "", duration_days: 30 });
  showAddModal.value = true;
};

const addDriver = async () => {
  if (!newDriver.user_id) {
    alert("User ID wajib diisi!");
    return;
  }
  try {
    await createDriver(newDriver);
    showAddModal.value = false;
    fetchDrivers(1);
  } catch (err) {
    alert("Gagal menambah driver: " + err.message);
  }
};

const openRenewModal = (driver) => {
  selectedDriver.value = driver;
  renewDays.value = 30;
  showRenewModal.value = true;
};

const renewDriver = async () => {
  try {
    await updateDriver(selectedDriver.value.user_id, { extend_days: renewDays.value, status: "active" });
    showRenewModal.value = false;
    fetchDrivers(pagination.value.page);
  } catch (err) {
    alert("Gagal memperpanjang driver: " + err.message);
  }
};

const confirmDelete = (driver) => {
  selectedDriver.value = driver;
  showDeleteModal.value = true;
};

const deleteDriverConfirmed = async () => {
  try {
    await deleteDriver(selectedDriver.value.user_id);
    drivers.value = drivers.value.filter((d) => d.user_id !== selectedDriver.value.user_id);
    showDeleteModal.value = false;
  } catch (err) {
    alert("Gagal menghapus driver: " + err.message);
  }
};

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("id-ID");
};

const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) <= new Date();
};

onMounted(() => fetchDrivers());
</script>
