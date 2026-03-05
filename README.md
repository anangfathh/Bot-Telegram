# 🤖 Telegram Mager Bot

Bot Telegram untuk sistem posting dan manajemen tumpangan (#ANJEM, #JASTIP, #OPENANJEM, #OPENJASTIP) dengan fitur driver management, rating system, dan auto-close posts.

---

## ✨ Features

- ✅ **Post Mager** - Posting dengan kategori (#ANJEM, #JASTIP, etc.)
- ✅ **My Magers** - Lihat history postingan
- ✅ **Close Mager** - Tutup postingan manual
- ✅ **Edit Post** - Edit postingan aktif
- ✅ **Auto-Close** - Otomatis tutup postingan expired
- ✅ **Check Price** - Kalkulator estimasi harga
- ✅ **Rating System** - Beri dan lihat rating user
- ✅ **Driver Management** - Kelola driver aktif
- ✅ **Force Join Channel** - Verifikasi membership
- ✅ **Multi-media Support** - Text, photo, video, document

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Copy environment file
cp .env.docker.example .env

# 2. Edit .env with your credentials
nano .env  # or notepad .env

# 3. Start with Docker
npm run docker:up

# 4. View logs
npm run docker:logs
```

📖 See [DOCKER-QUICKSTART.md](DOCKER-QUICKSTART.md) for details

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env
nano .env

# 3. Setup MySQL database
mysql -u root -p < init.sql

# 4. Start bot
npm run dev
```

### Option 3: Production with PM2

```bash
# 1. Install PM2
npm install -g pm2

# 2. Start bot
npm run pm2:start

# 3. Monitor
npm run pm2:monit
```

---

## 📋 Requirements

### Local/PM2 Setup

- Node.js 18+ (tested on v22.18.0)
- MySQL 8.0+
- Telegram Bot Token

### Docker Setup

- Docker Desktop 20.10+
- Docker Compose v2.0+

---

## ⚙️ Configuration

Create `.env` file:

```bash
# Telegram Configuration (REQUIRED)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=-1002920056294
TELEGRAM_CHANNEL_USERNAME=@cobaanjem

# Driver Configuration (OPTIONAL)
DRIVER_CONTACT_USERNAME=@youradmin
DRIVER_GROUP_ID=-1001234567890
DRIVER_GROUP_INVITE_LINK=https://t.me/+xxxxx
DRIVER_DEFAULT_ACTIVE_DAYS=30
DRIVER_ADMIN_IDS=123456789,987654321

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=mager_bot
DB_CONNECTION_LIMIT=10
```

---

## 📚 Documentation

- [DOCKER-QUICKSTART.md](DOCKER-QUICKSTART.md) - Quick Docker deployment
- [DOCKER.md](DOCKER.md) - Complete Docker guide
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Error handling & fixes
- [API Documentation](docs/API.md) - Bot commands & callbacks

---

## 🎯 Usage

### Bot Commands

```
/start  - Start bot and show menu
/mager  - Access Mager menu
/help   - Show help and tutorials
```

### Admin Commands (Driver Management)

1. **Add Driver**: Tambah driver baru dengan durasi aktif
2. **Renew Driver**: Perpanjang masa aktif driver
3. **Remove Driver**: Hapus driver dari sistem

### User Features

- **Post Mager**: Pilih kategori → kirim pesan/foto
- **My Magers**: Lihat 5 postingan terakhir
- **Close Mager**: Tutup postingan aktif
- **Edit Post**: Edit konten postingan
- **Check Price**: Hitung estimasi tarif berdasarkan jarak
- **Rating**: Beri rating atau lihat rating user

---

## 🛠️ Development

### Project Structure

```
Bot-Telegram/
├── main.js                 # Entry point
├── src/
│   ├── bot.js             # Bot initialization
│   ├── config.js          # Configuration
│   ├── database.js        # Database operations
│   ├── state.js           # User state management
│   ├── drivers.js         # Driver management
│   ├── posts.js           # Post operations
│   ├── membership.js      # Channel verification
│   ├── messages.js        # Message templates
│   ├── keyboards.js       # Keyboard builders
│   ├── telegram.js        # Telegram helpers
│   ├── scheduler.js       # Auto-close scheduler
│   └── handlers/
│       ├── callbacks.js   # Callback query handlers
│       ├── commands.js    # Command handlers
│       ├── messages.js    # Message handlers
│       └── system.js      # System event handlers
├── Dockerfile
├── docker-compose.yml
├── init.sql               # Database schema
├── ecosystem.config.js    # PM2 configuration
└── package.json
```

### Architecture Highlights

- **Clean Code Architecture** - Modular, maintainable codebase
- **Separation of Concerns** - Handlers, services, utilities separated
- **Error Handling** - Graceful fallbacks and retry mechanisms
- **State Management** - In-memory state with database persistence
- **Auto-recovery** - Webhook cleanup, polling error handling

---

## 🧪 Testing

### Test Basic Commands

```bash
# In Telegram
/start   # Should show welcome menu
/mager   # Should show Mager menu
/help    # Should show help text
```

### Test Posting

```
1. /mager → Post Mager → #ANJEM
2. Send text/photo
3. Check channel for posted message
4. /mager → My Magers → See your post
```

### Test Docker Deployment

```bash
# Start services
npm run docker:up

# Check logs
npm run docker:logs

# Should see:
# ✅ Bot started!
# ✅ Webhook deleted
# ✅ Polling started
```

---

## 📊 Database Schema

### Tables

- **users** - User profiles
- **user_posts** - Post history with auto-close
- **user_ratings** - Rating system
- **drivers** - Active driver list

### Auto-close Schedule

- `#ANJEM`: 1 hour
- `#JASTIP`: 5 hours
- `#OPENANJEM`: 24 hours
- `#OPENJASTIP`: 24 hours

---

## 🔧 Scripts

### NPM Scripts

```bash
# Development
npm run dev              # Start with nodemon
npm run start            # Start production

# PM2
npm run pm2:start        # Start with PM2
npm run pm2:stop         # Stop PM2
npm run pm2:restart      # Restart PM2
npm run pm2:logs         # View PM2 logs

# Docker
npm run docker:up        # Start containers
npm run docker:down      # Stop containers
npm run docker:logs      # View logs
npm run docker:restart   # Restart bot
npm run docker:clean     # Remove all

# Utilities
npm run kill             # Kill node processes (Windows)
npm run restart          # Kill & restart
```

---

## 🐛 Troubleshooting

### Error 409 Conflict

**Cause**: Multiple bot instances running

**Fix**:

```bash
# Kill all node processes
npm run kill

# Or use Docker
npm run docker:restart
```

### Query Too Old Error

**Fix**: Already handled with `safeEditOrSend()` fallback

### Database Connection Error

**Fix**:

```bash
# Check MySQL is running
# Docker: npm run docker:ps
# Local: systemctl status mysql

# Restart services
npm run docker:restart
```

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for more issues.

---

## 🚀 Deployment

### Production with Docker

```bash
# 1. Setup on VPS
scp -r Bot-Telegram/ user@server:/app/

# 2. Configure
cd /app/Bot-Telegram
cp .env.docker.example .env
nano .env

# 3. Deploy
npm run docker:up

# 4. Monitor
npm run docker:logs
```

### Production with PM2

```bash
# Install PM2
npm install -g pm2

# Start
npm run pm2:start

# Auto-start on reboot
pm2 save
pm2 startup
```

---

## 📈 Monitoring

### Docker

```bash
# Resource usage
docker stats

# Logs
npm run docker:logs

# Health check
docker-compose ps
```

### PM2

```bash
# Monitor dashboard
npm run pm2:monit

# Logs
npm run pm2:logs

# Status
pm2 status
```

---

## 🔐 Security

- ✅ Environment variables for secrets
- ✅ Database credentials not hardcoded
- ✅ Channel membership verification
- ✅ Admin-only driver management
- ✅ Input validation and sanitization
- ✅ SQL injection prevention (prepared statements)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📝 License

ISC License - See LICENSE file for details

---

## 👤 Author

**anangfath**

---

## 📞 Support

- Create an issue for bug reports
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems
- See [DOCKER.md](DOCKER.md) for deployment help

---

## 🎉 Acknowledgments

- [node-telegram-bot-api](https://github.com/yagop/node-telegram-bot-api)
- [MySQL](https://www.mysql.com/)
- [Docker](https://www.docker.com/)

---

Made with ❤️ for Kampusku Community

