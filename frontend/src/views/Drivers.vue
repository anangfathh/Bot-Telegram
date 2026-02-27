<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Drivers</h1>
        <p class="text-muted-foreground">Kelola data driver</p>
      </div>
      <Button @click="openAddModal">
        <Plus class="mr-2 h-4 w-4" />
        Tambah Driver
      </Button>
    </div>

    <!-- Toolbar -->
    <div class="flex items-center gap-4">
      <Select v-model="filter.status" class="w-40" @update:modelValue="fetchDrivers(1)">
        <option value="">Semua Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
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
            <TableHead>User ID</TableHead>
            <TableHead>Username</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="driver in drivers" :key="driver.user_id">
            <TableCell class="font-mono">{{ driver.user_id }}</TableCell>
            <TableCell>{{ driver.username || '-' }}</TableCell>
            <TableCell>{{ driver.full_name || '-' }}</TableCell>
            <TableCell>
              <Badge :variant="driver.status === 'active' ? 'success' : 'destructive'">
                {{ driver.status }}
              </Badge>
            </TableCell>
            <TableCell>{{ formatDate(driver.joined_at) }}</TableCell>
            <TableCell :class="isExpired(driver.expires_at) ? 'text-destructive' : ''">
              {{ formatDate(driver.expires_at) }}
            </TableCell>
            <TableCell>
              <div class="flex gap-2">
                <Button variant="outline" size="sm" @click="openRenewModal(driver)">
                  <RefreshCw class="mr-1 h-3 w-3" />
                  Renew
                </Button>
                <Button variant="destructive" size="sm" @click="confirmDelete(driver)">
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="drivers.length === 0">
            <TableCell colspan="7" class="text-center py-8 text-muted-foreground">
              Belum ada driver
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" :disabled="pagination.page === 1" @click="fetchDrivers(pagination.page - 1)">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <span class="text-sm text-muted-foreground">
        Halaman {{ pagination.page }} dari {{ pagination.totalPages }}
      </span>
      <Button variant="outline" size="sm" :disabled="pagination.page === pagination.totalPages" @click="fetchDrivers(pagination.page + 1)">
        <ChevronRight class="h-4 w-4" />
      </Button>
    </div>

    <!-- Add Driver Dialog -->
    <Dialog v-model:open="showAddModal">
      <div class="space-y-4">
        <h2 class="text-lg font-semibold">Tambah Driver Baru</h2>
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
          Apakah Anda yakin ingin menghapus driver <strong>{{ selectedDriver?.username || selectedDriver?.full_name || selectedDriver?.user_id }}</strong>?
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
import { ref, reactive, onMounted } from 'vue'
import { Card, CardContent, Button, Badge, Input, Select, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Dialog } from '@/components/ui'
import { Loader2, Plus, RefreshCw, Trash2, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { getDrivers, createDriver, updateDriver, deleteDriver } from '@/api'

const drivers = ref([])
const loading = ref(true)
const error = ref(null)
const pagination = ref({ page: 1, totalPages: 1 })
const filter = reactive({ status: '' })

const showAddModal = ref(false)
const showRenewModal = ref(false)
const showDeleteModal = ref(false)
const selectedDriver = ref(null)
const renewDays = ref(30)

const newDriver = reactive({
  user_id: '',
  username: '',
  full_name: '',
  duration_days: 30
})

const fetchDrivers = async (page = 1) => {
  loading.value = true
  try {
    const response = await getDrivers({ page, limit: 20, status: filter.status })
    drivers.value = response.data.data
    pagination.value = response.data.pagination
  } catch (err) {
    error.value = 'Gagal memuat drivers: ' + err.message
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  Object.assign(newDriver, { user_id: '', username: '', full_name: '', duration_days: 30 })
  showAddModal.value = true
}

const addDriver = async () => {
  if (!newDriver.user_id) {
    alert('User ID wajib diisi!')
    return
  }
  try {
    await createDriver(newDriver)
    showAddModal.value = false
    fetchDrivers(1)
  } catch (err) {
    alert('Gagal menambah driver: ' + err.message)
  }
}

const openRenewModal = (driver) => {
  selectedDriver.value = driver
  renewDays.value = 30
  showRenewModal.value = true
}

const renewDriver = async () => {
  try {
    await updateDriver(selectedDriver.value.user_id, { extend_days: renewDays.value, status: 'active' })
    showRenewModal.value = false
    fetchDrivers(pagination.value.page)
  } catch (err) {
    alert('Gagal memperpanjang driver: ' + err.message)
  }
}

const confirmDelete = (driver) => {
  selectedDriver.value = driver
  showDeleteModal.value = true
}

const deleteDriverConfirmed = async () => {
  try {
    await deleteDriver(selectedDriver.value.user_id)
    drivers.value = drivers.value.filter(d => d.user_id !== selectedDriver.value.user_id)
    showDeleteModal.value = false
  } catch (err) {
    alert('Gagal menghapus driver: ' + err.message)
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('id-ID')
}

const isExpired = (date) => {
  if (!date) return false
  return new Date(date) <= new Date()
}

onMounted(() => fetchDrivers())
</script>
