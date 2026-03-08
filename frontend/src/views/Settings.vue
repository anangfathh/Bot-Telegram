<template>
  <div class="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p class="mt-1 text-muted-foreground">Atur tarif check dan daftar admin driver yang dipakai bot.</p>
      </div>
      <Button variant="outline" class="shadow-sm" :disabled="loading" @click="loadSettings">
        <RefreshCw class="mr-2 h-4 w-4" />
        Muat Ulang
      </Button>
    </div>

    <Card class="border-border/70 bg-card/95 shadow-sm">
      <CardContent class="flex flex-col gap-3 p-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <p class="font-medium text-foreground">Perubahan langsung tersimpan ke database.</p>
          <p>Bot akan memakai tarif dan kontak admin driver terbaru tanpa perlu ubah file env lagi.</p>
        </div>
        <Badge variant="secondary" class="w-fit">Runtime Config</Badge>
      </CardContent>
    </Card>

    <div v-if="loading" class="flex flex-col items-center justify-center gap-4 py-20">
      <Loader2 class="h-10 w-10 animate-spin text-primary" />
      <p class="text-muted-foreground">Memuat pengaturan...</p>
    </div>

    <Card v-else-if="error" class="border-destructive/50 bg-destructive/5 shadow-sm">
      <CardContent class="flex items-center gap-2 pt-6 text-destructive">
        <AlertCircle class="h-5 w-5" />
        <span>{{ error }}</span>
      </CardContent>
    </Card>

    <div v-else class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.95fr)]">
      <Card class="border-border/70 bg-card/95 shadow-sm">
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-xl">
            <Wallet class="h-5 w-5 text-primary" />
            Konfigurasi Tarif
          </CardTitle>
          <CardDescription>Tarif dasar dan formula kalkulator ongkos bot.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-5">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <label class="text-sm font-medium">Biaya dasar</label>
              <Input v-model="form.baseFare" type="number" min="1" placeholder="7000" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Biaya per langkah</label>
              <Input v-model="form.stepFare" type="number" min="1" placeholder="1500" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Jarak per langkah (meter)</label>
              <Input v-model="form.distanceStepMeters" type="number" min="1" placeholder="500" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Tambahan tetap saat hujan</label>
              <Input v-model="form.rainSurcharge" type="number" min="1" placeholder="5000" />
            </div>
            <div class="space-y-2 md:col-span-2">
              <label class="text-sm font-medium">Tambahan dini hari (23.00-04.59 WIB)</label>
              <Input v-model="form.nightSurcharge" type="number" min="1" placeholder="5000" />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-2 text-sm font-medium">
              <Users class="h-4 w-4 text-primary" />
              Admin Driver
            </div>
            <textarea
              v-model="form.driverContactText"
              rows="7"
              class="flex min-h-[168px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="@admin_driver_1&#10;@admin_driver_2"
            />
            <p class="text-xs text-muted-foreground">Isi satu username per baris. Boleh dengan atau tanpa awalan `@`.</p>
          </div>

          <div class="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p v-if="successMessage" class="text-sm text-emerald-600">{{ successMessage }}</p>
            <p v-else class="text-xs text-muted-foreground">Hujan dan dini hari menambah biaya tetap ke total akhir. Dini hari aktif otomatis pada 23.00-04.59 WIB.</p>
            <Button class="shadow-md" :disabled="saving" @click="saveSettings">
              <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
              <Save v-else class="mr-2 h-4 w-4" />
              Simpan Pengaturan
            </Button>
          </div>
        </CardContent>
      </Card>

      <div class="space-y-6">
        <Card class="border-border/70 bg-card/95 shadow-sm">
          <CardHeader class="space-y-1">
            <CardTitle class="text-xl">Preview Tarif</CardTitle>
            <CardDescription>Formula yang akan dipakai menu tarif check.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-primary/70">Formula Normal</p>
              <p class="mt-2 text-sm font-medium text-foreground">{{ pricingSummary }}</p>
            </div>
            <div class="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Saat Hujan</p>
              <p class="mt-2 text-sm text-foreground">{{ rainyPricingSummary }}</p>
            </div>
            <div class="rounded-2xl border border-border/70 bg-muted/40 p-4">
              <p class="text-xs uppercase tracking-[0.16em] text-muted-foreground">Saat Dini Hari</p>
              <p class="mt-2 text-sm text-foreground">{{ nightPricingSummary }}</p>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card/95 shadow-sm">
          <CardHeader class="space-y-1">
            <CardTitle class="text-xl">Admin Driver Aktif</CardTitle>
            <CardDescription>Username ini akan muncul di bot dan tombol chat admin.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div v-if="driverContacts.length > 0" class="flex flex-wrap gap-2">
              <Badge v-for="username in driverContacts" :key="username" variant="secondary" class="rounded-full px-3 py-1 text-sm">
                {{ username }}
              </Badge>
            </div>
            <p v-else class="text-sm text-destructive">Minimal satu username admin driver harus diisi.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { AlertCircle, Loader2, RefreshCw, Save, Users, Wallet } from "lucide-vue-next";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { getSettings, updateSettings } from "@/api";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const loading = ref(true);
const saving = ref(false);
const error = ref("");
const successMessage = ref("");

const form = reactive({
  baseFare: "",
  stepFare: "",
  distanceStepMeters: "",
  rainSurcharge: "",
  nightSurcharge: "",
  driverContactText: "",
});

const driverContacts = computed(() => {
  const unique = new Set();

  form.driverContactText
    .split(/[\r\n,]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .forEach((value) => {
      unique.add(value.startsWith("@") ? value : `@${value}`);
    });

  return Array.from(unique);
});

const pricingNumbers = computed(() => ({
  baseFare: Number(form.baseFare) || 0,
  stepFare: Number(form.stepFare) || 0,
  distanceStepMeters: Number(form.distanceStepMeters) || 0,
  rainSurcharge: Number(form.rainSurcharge) || 0,
  nightSurcharge: Number(form.nightSurcharge) || 0,
}));

const pricingSummary = computed(() => {
  const pricing = pricingNumbers.value;
  return `${currencyFormatter.format(pricing.baseFare)} biaya awal + ${currencyFormatter.format(pricing.stepFare)} tiap ${pricing.distanceStepMeters} meter berikutnya.`;
});

const rainyPricingSummary = computed(() => {
  const pricing = pricingNumbers.value;
  return `${pricingSummary.value} Lalu ditambah ${currencyFormatter.format(pricing.rainSurcharge)} bila hujan.`;
});

const nightPricingSummary = computed(() => {
  const pricing = pricingNumbers.value;
  return `${pricingSummary.value} Lalu ditambah ${currencyFormatter.format(pricing.nightSurcharge)} bila order masuk antara 23.00-04.59 WIB.`;
});

function applySettings(settings) {
  form.baseFare = String(settings.pricing.baseFare ?? "");
  form.stepFare = String(settings.pricing.stepFare ?? "");
  form.distanceStepMeters = String(settings.pricing.distanceStepMeters ?? "");
  form.rainSurcharge = String(settings.pricing.rainSurcharge ?? "");
  form.nightSurcharge = String(settings.pricing.nightSurcharge ?? "");
  form.driverContactText = (settings.driverContactUsernames || []).join("\n");
}

async function loadSettings() {
  loading.value = true;
  error.value = "";
  successMessage.value = "";

  try {
    const response = await getSettings();
    applySettings(response.data.data);
  } catch (err) {
    error.value = err.response?.data?.error || `Gagal memuat settings: ${err.message}`;
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  error.value = "";
  successMessage.value = "";

  if (driverContacts.value.length === 0) {
    error.value = "Minimal satu username admin driver wajib diisi.";
    return;
  }

  saving.value = true;

  try {
    const payload = {
      driverContactUsernames: driverContacts.value,
      pricing: {
        baseFare: Number(form.baseFare),
        stepFare: Number(form.stepFare),
        distanceStepMeters: Number(form.distanceStepMeters),
        rainSurcharge: Number(form.rainSurcharge),
        nightSurcharge: Number(form.nightSurcharge),
      },
    };

    const response = await updateSettings(payload);
    applySettings(response.data.data);
    successMessage.value = "Pengaturan berhasil disimpan.";
  } catch (err) {
    error.value = err.response?.data?.error || `Gagal menyimpan settings: ${err.message}`;
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>
