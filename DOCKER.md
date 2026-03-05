# 🐳 Docker Deployment Guide

## 📋 Prerequisites

- Docker Desktop installed (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v2.0+
- Bot Token dari @BotFather

---

## 🚀 Quick Start

### 1. Clone & Setup

```bash
cd Bot-Telegram
```

### 2. Copy Environment File

```bash
# Windows
copy .env.docker.example .env

# Linux/Mac
cp .env.docker.example .env
```

### 3. Edit .env File

Edit file `.env` dan isi dengan credentials Anda:

```bash
# Telegram Bot Token (WAJIB)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz

# Channel ID (WAJIB)
TELEGRAM_CHANNEL_ID=-1002920056294

# Driver Admin IDs (Optional)
DRIVER_ADMIN_IDS=123456789,987654321

# Database Password (Optional, default: bot_password)
DB_PASSWORD=your_secure_password_here
```

### 4. Build & Run

```bash
# Build dan jalankan semua services
docker-compose up -d

# Lihat logs
docker-compose logs -f bot

# Stop services
docker-compose down
```

---

## 📦 Docker Commands

### Build & Start

```bash
# Build images
docker-compose build

# Start services (detached mode)
docker-compose up -d

# Start services (with logs)
docker-compose up

# Rebuild and start
docker-compose up -d --build
```

### Monitor & Logs

```bash
# View all logs
docker-compose logs -f

# View bot logs only
docker-compose logs -f bot

# View MySQL logs only
docker-compose logs -f mysql

# View last 100 lines
docker-compose logs --tail=100 bot
```

### Stop & Cleanup

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

### Container Management

```bash
# List running containers
docker-compose ps

# Restart specific service
docker-compose restart bot
docker-compose restart mysql

# Access container shell
docker-compose exec bot sh
docker-compose exec mysql bash

# View container resource usage
docker stats
```

---

## 🔍 Troubleshooting

### Bot tidak start?

```bash
# Check logs
docker-compose logs bot

# Common issues:
# 1. Missing TELEGRAM_BOT_TOKEN → Edit .env
# 2. MySQL not ready → Wait 30s and restart
# 3. Port conflict → Change port in docker-compose.yml
```

### Database connection error?

```bash
# Check MySQL health
docker-compose ps

# Should show "healthy" status
# If not, check MySQL logs:
docker-compose logs mysql

# Restart MySQL
docker-compose restart mysql

# Wait for healthy status
docker-compose ps
```

### Reset database?

```bash
# Stop services and remove volume
docker-compose down -v

# Start fresh
docker-compose up -d

# Data will be recreated from init.sql
```

### Check if bot is running?

```bash
# Inside container
docker-compose exec bot ps aux | grep node

# Check bot logs
docker-compose logs --tail=50 bot

# Should see:
# ✅ Bot started!
# ✅ Webhook deleted
# ✅ Polling started
```

---

## 🔧 Configuration

### Environment Variables

Edit `docker-compose.yml` or `.env` file:

```yaml
environment:
  # Required
  TELEGRAM_BOT_TOKEN: ${TELEGRAM_BOT_TOKEN}
  TELEGRAM_CHANNEL_ID: ${TELEGRAM_CHANNEL_ID}

  # Optional
  DRIVER_GROUP_ID: ${DRIVER_GROUP_ID}
  DB_PASSWORD: ${DB_PASSWORD:-bot_password}
```

### Change MySQL Port

Edit `docker-compose.yml`:

```yaml
mysql:
  ports:
    - "3307:3306" # Host:Container
```

### Change Memory Limit

Edit `docker-compose.yml`:

```yaml
bot:
  deploy:
    resources:
      limits:
        memory: 512M
```

---

## 📊 Database Access

### Access MySQL from host

```bash
mysql -h 127.0.0.1 -P 3306 -u bot_user -p
# Password: bot_password (or your custom password)
```

### Access MySQL from container

```bash
docker-compose exec mysql mysql -u root -p
# Password: bot_password (or your custom password)

USE mager_bot;
SHOW TABLES;
SELECT * FROM users LIMIT 10;
```

### Backup Database

```bash
# Backup
docker-compose exec mysql mysqldump -u root -p mager_bot > backup.sql

# Restore
docker-compose exec -T mysql mysql -u root -p mager_bot < backup.sql
```

---

## 🔐 Security Best Practices

### 1. Change Default Passwords

Edit `.env`:

```bash
DB_PASSWORD=your_very_secure_password_here_123!@#
```

### 2. Don't Commit .env

Already in `.gitignore`, but double check:

```bash
echo ".env" >> .gitignore
```

### 3. Use Docker Secrets (Production)

```yaml
# docker-compose.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  bot_token:
    file: ./secrets/bot_token.txt

services:
  bot:
    secrets:
      - bot_token
      - db_password
```

---

## 🌐 Production Deployment

### Deploy to VPS

```bash
# 1. Copy files to server
scp -r Bot-Telegram/ user@server:/home/user/

# 2. SSH to server
ssh user@server

# 3. Navigate and setup
cd Bot-Telegram
cp .env.docker.example .env
nano .env  # Edit credentials

# 4. Run
docker-compose up -d

# 5. Check status
docker-compose ps
docker-compose logs -f bot
```

### Auto-restart on reboot

Add to systemd or use Docker restart policy (already configured):

```yaml
services:
  bot:
    restart: unless-stopped # ✅ Already set
```

### Update deployed bot

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f bot
```

---

## 📈 Monitoring

### Health Check

```bash
# Check container health
docker-compose ps

# Check bot is responding
docker-compose exec bot ps aux | grep node
```

### View Logs

```bash
# Real-time logs
docker-compose logs -f bot

# Logs saved to ./logs directory
ls -lah logs/
```

### Resource Usage

```bash
# View CPU/Memory usage
docker stats

# Should show:
# CONTAINER          CPU %   MEM USAGE / LIMIT
# telegram-bot-app   0.5%    50MB / 512MB
# telegram-bot-mysql 1.0%    200MB / 1GB
```

---

## 🆘 Emergency Commands

### Bot crashed and won't start?

```bash
# Full restart
docker-compose down
docker-compose up -d

# View errors
docker-compose logs --tail=100 bot
```

### Clean slate (reset everything)?

```bash
# ⚠️ WARNING: This deletes all data!
docker-compose down -v --rmi all
docker-compose up -d
```

### Database corrupted?

```bash
# Remove volume and reinit
docker-compose down -v
docker-compose up -d
```

---

## 📞 Support

If you encounter issues:

1. Check logs: `docker-compose logs -f bot`
2. Check status: `docker-compose ps`
3. Verify .env: `cat .env`
4. Check MySQL: `docker-compose logs mysql`
5. Restart: `docker-compose restart bot`

---

## 📝 Notes

- Bot runs on Node.js 22 Alpine (lightweight)
- MySQL 8.0 with persistent volume
- Automatic database initialization via `init.sql`
- Logs saved to `./logs` directory
- Health checks configured for both services
- Auto-restart on crash
- Production-ready configuration

---

## 🎯 Checklist

Before deploying:

- [ ] Bot token set in `.env`
- [ ] Channel ID set in `.env`
- [ ] Admin IDs set (if needed)
- [ ] Strong database password
- [ ] `.env` not committed to git
- [ ] Docker and Docker Compose installed
- [ ] Ports 3306 available (or changed)
- [ ] Bot is admin in channel
- [ ] Bot is admin in driver group (if used)

Ready to go! 🚀

