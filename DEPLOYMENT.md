# 🚀 CI/CD & Deployment Guide

## 📋 Daftar Isi

- [Arsitektur CI/CD](#arsitektur-cicd)
- [Setup GitHub Actions](#setup-github-actions)
- [Deployment ke Production](#deployment-ke-production)
- [Docker Production-Grade](#docker-production-grade)
- [Monitoring & Logging](#monitoring--logging)
- [Troubleshooting](#troubleshooting)

## 🏗️ Arsitektur CI/CD

Pipeline CI/CD menggunakan GitHub Actions dengan tahapan:

```
┌─────────────┐
│  Push Code  │
└──────┬──────┘
       │
       ├──────────────────────────────┐
       │                              │
┌──────▼────────┐            ┌───────▼────────┐
│ Test Backend  │            │ Test Frontend  │
└──────┬────────┘            └───────┬────────┘
       │                              │
       └──────────────┬───────────────┘
                      │
              ┌───────▼────────┐
              │ Build & Push   │
              │ Docker Images  │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Security Scan  │
              │    (Trivy)     │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Deploy to Prod │
              └────────────────┘
```

## 🔧 Setup GitHub Actions

### 1. Repository Secrets

Tambahkan secrets di GitHub repository Anda:
`Settings` → `Secrets and variables` → `Actions` → `New repository secret`

**Required Secrets:**

```bash
# Untuk Deployment (Opsional - jika auto-deploy)
DEPLOY_HOST=your.server.ip
DEPLOY_USER=your-ssh-user
DEPLOY_SSH_KEY=your-private-ssh-key
DEPLOY_PATH=/path/to/deployment
DEPLOY_PORT=22

# Untuk Notifications (Opsional)
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
```

### 2. GitHub Container Registry (GHCR)

GitHub Actions otomatis menggunakan GHCR untuk menyimpan Docker images.

**Lokasi images:**

```
ghcr.io/anangfathh/bot-telegram:latest
ghcr.io/anangfathh/bot-telegram-frontend:latest
```

**Tag Strategy:**

- `latest` - untuk branch main
- `develop` - untuk branch develop
- `v1.2.3` - untuk release tags
- `main-abc123` - untuk commit SHA

### 3. Enable Container Registry

1. Go to repository Settings → Actions → General
2. Set "Workflow permissions" to "Read and write permissions"
3. Enable "Allow GitHub Actions to create and approve pull requests"

## 🚀 Deployment ke Production

### Option 1: Manual Deployment

```bash
# 1. Clone repository di server
git clone https://github.com/anangfathh/Bot-Telegram.git
cd Bot-Telegram

# 2. Setup environment variables
cp .env.example .env
nano .env

# 3. Create Docker secrets
echo "your-bot-token" | docker secret create telegram_bot_token -
echo "your-db-password" | docker secret create db_password -
echo "your-admin-password" | docker secret create admin_password -

# 4. Deploy dengan docker-compose
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 5. Check logs
docker-compose logs -f
```

### Option 2: Auto Deployment via GitHub Actions

Pipeline akan otomatis deploy ke production ketika push ke branch `main`.

**Setup server untuk auto-deployment:**

```bash
# 1. Install Docker di server
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Setup SSH key
ssh-keygen -t ed25519 -C "github-actions"
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# 3. Copy private key ke GitHub Secrets (DEPLOY_SSH_KEY)
cat ~/.ssh/id_ed25519

# 4. Login ke GHCR di server
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 5. Create deployment directory
mkdir -p /opt/bot-telegram
cd /opt/bot-telegram

# 6. Create .env file
nano .env
```

### Docker Production Configuration

File `docker-compose.prod.yml` menyediakan:

✅ **Security:**

- Docker secrets untuk data sensitif
- Non-root users
- Read-only filesystem untuk frontend
- Security headers
- Capabilities dropping

✅ **Performance:**

- Resource limits (CPU & Memory)
- Optimized MySQL configuration
- Gzip compression
- Static file caching
- Multi-stage builds

✅ **Reliability:**

- Health checks
- Restart policies
- Log rotation
- Graceful shutdown

✅ **Monitoring:**

- Structured logging
- Log rotation (10MB max, 3 files)
- Container labels untuk monitoring tools

## 📊 Monitoring & Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f bot
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 bot
```

### Health Checks

```bash
# Check service health
docker ps

# API health endpoint
curl http://localhost:3001/health

# Frontend health
curl http://localhost:8080
```

### Container Stats

```bash
# Real-time resource usage
docker stats

# Inspect specific container
docker inspect telegram-bot-app
```

## 🔒 Security Best Practices

### 1. Docker Secrets

Gunakan Docker secrets untuk data sensitif:

```bash
# Create secrets
echo "token" | docker secret create telegram_bot_token -
echo "password" | docker secret create db_password -
echo "admin-password" | docker secret create admin_password -

# List secrets
docker secret ls

# Remove secret
docker secret rm telegram_bot_token
```

### 2. Environment Variables

**JANGAN commit file .env ke Git!**

Template `.env`:

```env
# Telegram
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_CHANNEL_ID=your-channel-id

# Database
DB_PASSWORD=strong-password-here
DB_NAME=mager_bot

# Admin dashboard
ADMIN_USERNAME=admin
ADMIN_SESSION_TTL_HOURS=12

# Docker Registry (untuk CI/CD)
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_BOT=anangfathh/bot-telegram
DOCKER_IMAGE_FRONTEND=anangfathh/bot-telegram-frontend
IMAGE_TAG=latest
```

### 3. Network Security

```bash
# Gunakan internal network untuk services
# MySQL tidak perlu expose port di production
# Hanya expose frontend dan API yang diperlukan
```

### 4. Regular Updates

```bash
# Update base images
docker-compose pull
docker-compose up -d

# Update dependencies
npm audit fix
```

## 🛠️ Troubleshooting

### Build Failures

```bash
# Clear build cache
docker builder prune -af

# Rebuild without cache
docker-compose build --no-cache

# Check build logs
docker-compose build bot
```

### Container Won't Start

```bash
# Check logs
docker-compose logs bot

# Check if port is already in use
netstat -tulpn | grep 3001

# Restart services
docker-compose restart
```

### Database Connection Issues

```bash
# Check MySQL health
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# Access MySQL console
docker-compose exec mysql mysql -u root -p

# Reset database
docker-compose down -v
docker-compose up -d
```

### GitHub Actions Failures

1. **Authentication Error:**
   - Check GITHUB_TOKEN permissions
   - Verify "Read and write permissions" enabled

2. **Build Timeout:**
   - Optimize Dockerfile
   - Use build cache properly

3. **Deploy Failed:**
   - Verify SSH key in secrets
   - Check server accessibility
   - Verify DEPLOY_PATH exists

## 📝 Maintenance Tasks

### Weekly

```bash
# Update images
docker-compose pull

# Clean unused images
docker image prune -f

# Backup database
docker-compose exec mysql mysqldump -u root -p mager_bot > backup.sql
```

### Monthly

```bash
# Update dependencies
npm update
cd frontend && npm update

# Security audit
npm audit
docker scan telegram-bot-app

# Review logs
docker-compose logs --since 30d > logs.txt
```

## 🎯 Deployment Checklist

### Pre-Deployment

- [ ] Run tests locally
- [ ] Update CHANGELOG.md
- [ ] Bump version in package.json
- [ ] Review security scan results
- [ ] Backup production database
- [ ] Notify team

### Deployment

- [ ] Merge to main branch
- [ ] Wait for CI/CD pipeline
- [ ] Verify images pushed to registry
- [ ] Monitor deployment logs
- [ ] Run smoke tests

### Post-Deployment

- [ ] Verify all services running
- [ ] Check health endpoints
- [ ] Monitor error logs (15 mins)
- [ ] Test critical features
- [ ] Update documentation

## 🆘 Rollback Procedure

```bash
# Option 1: Rollback to previous image
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Option 2: Deploy specific version
export IMAGE_TAG=v1.2.3
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Option 3: Git rollback
git revert HEAD
git push
# Wait for CI/CD to deploy
```

## 📞 Support

- **Issues:** https://github.com/anangfathh/Bot-Telegram/issues
- **Discussions:** https://github.com/anangfathh/Bot-Telegram/discussions

---

**Last Updated:** 2026-02-10
**Version:** 1.0.0
