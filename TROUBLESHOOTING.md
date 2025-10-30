# 🔧 Troubleshooting Guide

## ❌ Error 409 Conflict

**Error:**

```
ETELEGRAM: 409 Conflict: terminated by other getUpdates request
```

**Penyebab:**

- Ada lebih dari 1 instance bot yang berjalan
- Webhook masih aktif sementara menggunakan polling

**Solusi:**

### 1. Kill Semua Process Node

```bash
# Windows
taskkill /F /IM node.exe

# Linux/Mac
pkill -9 node
```

### 2. Cek dan Hapus Webhook

```bash
# Cek webhook
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"

# Hapus webhook
curl "https://api.telegram.org/bot<YOUR_TOKEN>/deleteWebhook"
```

### 3. Restart Bot

```bash
npm run dev
```

---

## ⚠️ Error "query is too old"

**Error:**

```
Bad Request: query is too old and response timeout expired or query ID is invalid
```

**Penyebab:**

- Callback query terlalu lama tidak di-handle
- Bot restart saat user menekan tombol

**Solusi:**

- ✅ Sudah ditangani otomatis dengan `safeEditOrSend()` function
- Bot akan fallback ke `sendMessage()` jika edit gagal

---

## 🚀 Production Deployment dengan PM2

### Install PM2

```bash
npm install -g pm2
```

### Commands

```bash
# Start bot
npm run pm2:start

# Stop bot
npm run pm2:stop

# Restart bot
npm run pm2:restart

# Delete dari PM2
npm run pm2:delete

# View logs
npm run pm2:logs

# Monitor
npm run pm2:monit

# Save process list
pm2 save

# Auto-start on reboot (Windows)
pm2 startup
```

---

## 📝 Development vs Production

### Development (dengan nodemon)

```bash
npm run dev
```

- Auto-restart saat file berubah
- Cocok untuk testing

### Production (dengan PM2)

```bash
npm run pm2:start
```

- Auto-restart saat crash
- Log management
- Memory limit protection
- Process monitoring

---

## 🔍 Debug Tips

### 1. Cek Log Bot

```bash
# Development
Lihat di terminal

# Production (PM2)
npm run pm2:logs
```

### 2. Cek Process yang Berjalan

```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

### 3. Cek Database Connection

```bash
# MySQL
mysql -u root -p
USE mager_bot;
SHOW TABLES;
```

### 4. Test Bot Token

```bash
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getMe"
```

---

## 📊 Monitoring

### PM2 Monitoring

```bash
pm2 monit
```

### System Resources

- Memory limit: 500MB (auto-restart)
- Max restarts: 10x
- Min uptime: 10s

---

## 🆘 Emergency Commands

### Kill All Node Processes

```bash
npm run kill
```

### Force Restart

```bash
npm run restart
```

### Delete Bot from PM2

```bash
npm run pm2:delete
```

---

## 📞 Support

Jika masih ada masalah:

1. Check logs: `npm run pm2:logs`
2. Cek webhook: `getWebhookInfo`
3. Pastikan hanya 1 instance running
4. Restart bot: `npm run pm2:restart`
