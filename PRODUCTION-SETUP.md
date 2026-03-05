# Setup Production Environment

## Quick Production Setup Guide

### Prerequisites

- Docker & Docker Compose installed
- GitHub account with access to repository
- Server with SSH access (for deployment)

### 1. Environment Configuration

Create `.env` file:

```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=@yourchannel
TELEGRAM_CHANNEL_USERNAME=@yourchannel

# Driver Configuration
DRIVER_CONTACT_USERNAME=@youradmin
DRIVER_GROUP_ID=-100xxxxxxxxxx
DRIVER_GROUP_INVITE_LINK=https://t.me/+xxxxx
DRIVER_DEFAULT_ACTIVE_DAYS=30
DRIVER_ADMIN_IDS=123456789,987654321

# Database Configuration
DB_PASSWORD=your_secure_password_here
DB_NAME=mager_bot
DB_CONNECTION_LIMIT=10

# Admin Dashboard Login
ADMIN_USERNAME=admin
ADMIN_SESSION_TTL_HOURS=12

# Ports
API_PORT=3001
FRONTEND_PORT=8080

# Docker Registry (for CI/CD)
DOCKER_REGISTRY=ghcr.io
DOCKER_IMAGE_BOT=anangfathh/bot-telegram
DOCKER_IMAGE_FRONTEND=anangfathh/bot-telegram-frontend
IMAGE_TAG=latest
```

### 2. Create Docker Secrets (Production)

For production deployment with secrets:

```bash
# Create secrets for sensitive data
echo "your-telegram-bot-token" | docker secret create telegram_bot_token -
echo "your-secure-db-password" | docker secret create db_password -
echo "your-secure-admin-password" | docker secret create admin_password -

# Verify secrets created
docker secret ls
```

### 3. Development Mode

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Production Mode

```bash
# Build and start with production configuration
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### 5. GitHub Actions Setup

Add these secrets to your GitHub repository:

- Go to: `Settings` → `Secrets and variables` → `Actions`

**For Auto-Deployment (Optional):**

```
DEPLOY_HOST=your.server.ip
DEPLOY_USER=your-ssh-user
DEPLOY_SSH_KEY=your-private-ssh-key-content
DEPLOY_PATH=/opt/bot-telegram
DEPLOY_PORT=22
```

**For Notifications (Optional):**

```
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx
```

### 6. Manual Production Deployment

```bash
# On your production server:

# 1. Clone repository
git clone https://github.com/anangfathh/Bot-Telegram.git
cd Bot-Telegram

# 2. Create .env file
nano .env
# (paste your configuration)

# 3. Create Docker secrets
echo "your-bot-token" | docker secret create telegram_bot_token -
echo "your-db-password" | docker secret create db_password -
echo "your-admin-password" | docker secret create admin_password -

# 4. Login to GitHub Container Registry
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# 5. Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Check status
docker-compose ps
docker-compose logs -f
```

### 7. Verify Deployment

```bash
# Check container status
docker ps

# Test API health
curl http://localhost:3001/health

# Test Frontend
curl http://localhost:8080

# View real-time logs
docker-compose logs -f bot
```

### 8. Common Commands

```bash
# Restart specific service
docker-compose restart bot

# Update and redeploy
git pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# View resource usage
docker stats

# Clean up old images
docker image prune -af

# Backup database
docker-compose exec mysql mysqldump -u root -p mager_bot > backup_$(date +%Y%m%d).sql

# Restore database
cat backup.sql | docker-compose exec -T mysql mysql -u root -p mager_bot
```

### 9. Security Checklist

- [ ] Change default passwords
- [ ] Use Docker secrets in production
- [ ] Don't commit .env to Git
- [ ] Keep dependencies updated
- [ ] Enable firewall on server
- [ ] Use HTTPS (with reverse proxy like Nginx/Caddy)
- [ ] Regular backups
- [ ] Monitor logs regularly

### 10. Monitoring

Add monitoring stack (optional):

```bash
# Use Prometheus + Grafana for monitoring
# Use ELK stack for log aggregation
# Use Sentry for error tracking
```

For detailed documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)
