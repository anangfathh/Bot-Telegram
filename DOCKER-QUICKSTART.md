# 🚀 Quick Start - Docker Deployment

## ⚡ Fastest Way to Deploy

### 1️⃣ **Prerequisites**

```bash
# Install Docker Desktop
# Windows: https://docs.docker.com/desktop/install/windows-install/
# Mac: https://docs.docker.com/desktop/install/mac-install/
# Linux: https://docs.docker.com/engine/install/

# Verify installation
docker --version
docker-compose --version
```

### 2️⃣ **Setup Environment**

```bash
# Copy environment template
cp .env.docker.example .env

# Edit with your credentials
# Windows: notepad .env
# Linux/Mac: nano .env
```

**Required values in `.env`:**

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHANNEL_ID=your_channel_id
```

### 3️⃣ **Start Bot**

```bash
# Using NPM scripts
npm run docker:up

# Or using docker-compose directly
docker-compose up -d

# Or using Makefile (Linux/Mac/WSL)
make up
```

### 4️⃣ **Check Status**

```bash
# View logs
npm run docker:logs

# Or
docker-compose logs -f bot

# Check running containers
npm run docker:ps
```

---

## 📋 Common Commands

### NPM Scripts (Cross-platform)

```bash
npm run docker:build      # Build images
npm run docker:up         # Start services
npm run docker:down       # Stop services
npm run docker:logs       # View bot logs
npm run docker:restart    # Restart bot
npm run docker:ps         # List containers
npm run docker:clean      # Remove everything
npm run docker:rebuild    # Rebuild and restart
```

### Docker Compose (Direct)

```bash
docker-compose up -d           # Start
docker-compose down            # Stop
docker-compose logs -f bot     # Logs
docker-compose ps              # Status
docker-compose restart bot     # Restart
```

### Makefile (Linux/Mac/WSL)

```bash
make up          # Start
make down        # Stop
make logs        # All logs
make logs-bot    # Bot logs only
make restart     # Restart all
make ps          # Status
make help        # Show all commands
```

---

## 🔍 Troubleshooting

### Bot tidak start?

```bash
# Check logs
npm run docker:logs

# Common fixes:
docker-compose restart bot
docker-compose down && docker-compose up -d
```

### Database error?

```bash
# Check MySQL status
docker-compose ps

# Restart MySQL
docker-compose restart mysql

# Wait 30 seconds then restart bot
docker-compose restart bot
```

### Reset everything?

```bash
# ⚠️ WARNING: Deletes all data!
npm run docker:clean
npm run docker:up
```

---

## 📚 Full Documentation

See [DOCKER.md](DOCKER.md) for complete guide including:

- Production deployment
- Database backup/restore
- Security best practices
- Advanced configuration
- Monitoring and debugging

---

## ✅ Checklist

Before deploying:

- [ ] Docker installed
- [ ] `.env` file created and filled
- [ ] Bot token configured
- [ ] Channel ID configured
- [ ] Bot is admin in channel

Then run:

```bash
npm run docker:up
```

Done! 🎉

