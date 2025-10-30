module.exports = {
  apps: [
    {
      name: "telegram-bot",
      script: "./main.js",
      instances: 1, // PENTING: Hanya 1 instance untuk mencegah 409 Conflict
      exec_mode: "fork", // Bukan "cluster"
      watch: false, // Set true jika ingin auto-reload saat file berubah
      ignore_watch: ["node_modules", "logs", "*.log"],
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
      error_file: "./logs/error.log",
      out_file: "./logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 4000,
    },
  ],
};
