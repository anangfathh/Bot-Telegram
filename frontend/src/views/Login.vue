<template>
  <div class="relative flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
    <div class="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_15%_20%,hsl(var(--foreground)/0.08),transparent_35%),radial-gradient(circle_at_85%_80%,hsl(var(--accent-foreground)/0.08),transparent_35%)]" />

    <Card class="relative w-full max-w-md border-border/70 bg-card/95 shadow-xl">
      <CardHeader class="space-y-1">
        <CardTitle class="font-display text-2xl font-semibold tracking-tight">Admin Login</CardTitle>
        <CardDescription>Masuk untuk membuka dashboard admin.</CardDescription>
      </CardHeader>

      <CardContent>
        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <label class="text-sm font-medium">Username</label>
            <Input v-model="form.username" type="text" placeholder="Masukkan username" />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">Password</label>
            <Input v-model="form.password" type="password" placeholder="Masukkan password" />
          </div>

          <p v-if="errorMessage" class="text-sm text-destructive">
            {{ errorMessage }}
          </p>

          <Button class="w-full" :disabled="loading">
            {{ loading ? "Memproses..." : "Login" }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/components/ui";
import { loginAdmin } from "@/api";
import { setAuthSession } from "@/auth";

const router = useRouter();
const route = useRoute();

const form = reactive({
  username: "",
  password: "",
});
const loading = ref(false);
const errorMessage = ref("");

function getRedirectPath() {
  const target = typeof route.query.redirect === "string" ? route.query.redirect : "/";
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/";
  }

  return target;
}

async function handleLogin() {
  if (!form.username || !form.password) {
    errorMessage.value = "Username dan password wajib diisi.";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    const response = await loginAdmin({
      username: form.username,
      password: form.password,
    });

    const token = response.data?.token;
    const user = response.data?.user;

    if (!token) {
      throw new Error("Token login tidak ditemukan");
    }

    setAuthSession({ token, user });
    await router.replace(getRedirectPath());
  } catch (error) {
    const apiMessage = error.response?.data?.error;
    errorMessage.value = apiMessage || "Login gagal. Cek username/password.";
  } finally {
    loading.value = false;
  }
}
</script>
