const { CONFIG } = require("./config");
const { getUserPosts } = require("./database");

function formatTimestamp(timestamp) {
  const now = new Date();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit yang lalu`;
  if (hours < 24) return `${hours} jam yang lalu`;
  if (days < 7) return `${days} hari yang lalu`;

  return timestamp.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getWelcomeMessage(firstName, isMember) {
  const membershipWarning = !isMember
    ? "\n⚠️ <i>Harap join channel terlebih dahulu untuk mengakses fitur Mager</i>\n"
    : "";

  return `Hai ${firstName}! 👋

Selamat datang di <b>Kampusku Bot</b> 🎓

Gunakan bot ini untuk:
• 🎯 <b>Lalala Mager</b> - Cari & posting tumpangan
${membershipWarning}
Ketik /help untuk panduan lengkap.`;
}

function getJoinChannelMessage() {
  return `⚠️ <b>Akses Ditolak</b>

Untuk menggunakan fitur Mager, Anda harus join channel terlebih dahulu:

📢 Channel: ${CONFIG.CHANNEL_USERNAME}

Setelah join, klik tombol "Saya Sudah Join" untuk verifikasi.`;
}

function getHelpMessage() {
  return `📖 <b>Panduan Kampusku Bot</b>

🎯 <b>Lalala MAGER</b>
Cari atau posting tumpangan ke kampus/tempat lain
• /mager - Buka menu mager
• #ANJEM - Cari tumpangan
• #JASTIP - Jastip barang
• #OPENANJEM - Buka jasa antar
• #OPENJASTIP - Buka jasa titip

📌 <b>CARA POSTING</b>
1. Ketik command /mager
2. Pilih "Post Mager"
3. Pilih kategori (#ANJEM, #JASTIP, dll)
4. Kirim pesanmu
5. Selesai! Postingan terkirim ke channel

⚠️ <b>ATURAN PENTING</b>
• Dilarang posting konten negatif
• Dilarang spam atau iklan berlebihan
• Hormati privasi dan kesopanan
• Pelanggaran = banned

💡 Butuh bantuan? Hubungi admin grup!`;
}

function getCategoryInfoMessage(category) {
  return `» ${category} 🚗

Input your message to post:
• post type: text, photo, video
• 1 post max 1 photo
• people can answer: driver and youself
• cost: 0 quota (FREE)

» This post will be sent to: https://t.me/+AcwluKqZkCtiYTc1
» Please read T&C in /help to not post agains the rules and you won't be banned

📝 Silakan kirim pesan Anda sekarang...`;
}

async function getMyMagersMessage(userId) {
  const posts = await getUserPosts(userId, 5);

  if (posts.length === 0) {
    return `📋 <b>My Magers</b>

Anda belum memiliki postingan.

Mulai posting sekarang dengan klik "Post Mager"!`;
  }

  let message = `📋 <b>My Magers</b>\n\n`;
  message += `Menampilkan ${posts.length} postingan terakhir Anda:\n\n`;

  posts.forEach((post, index) => {
    const typeIcon =
      {
        text: "📝",
        photo: "📸",
        video: "🎥",
        document: "📄",
      }[post.type] || "📝";

    const truncatedMessage = post.message.length > 50 ? post.message.substring(0, 50) + "..." : post.message;

    message += `${index + 1}. ${typeIcon} <b>${post.category}</b>\n`;
    message += `   "${truncatedMessage}"\n`;
    message += `   🕒 ${formatTimestamp(post.timestamp)}\n\n`;
  });

  message += `💡 <i>Untuk melihat postingan di channel, klik link channel.</i>`;

  return message;
}

function formatDateTimeId(date) {
  return date
    ? date.toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
}

function getDriverMenuMessage(isDriver, contactUsername) {
  const statusLine = isDriver
    ? "Status Anda saat ini: <b>Driver aktif</b>."
    : "Status Anda saat ini: <b>Belum terdaftar sebagai driver</b>.";

  return [
    "🚗 <b>Menu Driver</b>",
    statusLine,
    "",
    "Pendaftaran dan perpanjangan dilakukan melalui admin.",
    `Hubungi admin driver di: <b>${contactUsername}</b>`,
  ].join("\n");
}

function getDriverContactMessage(contactUsername) {
  return [
    "📨 <b>Pendaftaran Driver</b>",
    "",
    `Silakan hubungi admin driver di: <b>${contactUsername}</b>`,
    "",
    "Sampaikan data berikut saat menghubungi admin:",
    "• Nama lengkap",
    "• Username Telegram",
    "• Nomor kontak",
    "• Bukti pembayaran (jika perpanjang)",
  ].join("\n");
}

function getDriverStatusMessage(driver, contactUsername) {
  if (!driver) {
    return [
      "ℹ️ <b>Status Driver</b>",
      "",
      "Anda belum terdaftar sebagai driver.",
      `Hubungi admin driver di <b>${contactUsername}</b> untuk pendaftaran.`,
    ].join("\n");
  }

  const lines = [
    "🚗 <b>Status Driver</b>",
    "",
    `<b>Nama:</b> ${driver.fullName || "-"}`,
    `<b>Username:</b> ${driver.username || "-"}`,
    `<b>Status:</b> ${driver.status === "active" ? "Aktif" : "Non-aktif"}`,
  ];

  if (driver.joinedAt) {
    lines.push(`<b>Bergabung:</b> ${formatDateTimeId(driver.joinedAt)}`);
  }

  if (driver.expiresAt) {
    lines.push(`<b>Berlaku sampai:</b> ${formatDateTimeId(driver.expiresAt)}`);
  } else {
    lines.push("<b>Berlaku sampai:</b> Tidak ditentukan");
  }

  if (driver.status !== "active") {
    lines.push("");
    lines.push(`Status Anda non-aktif. Hubungi admin di <b>${contactUsername}</b> untuk aktivasi kembali.`);
  }

  return lines.join("\n");
}

module.exports = {
  formatTimestamp,
  getWelcomeMessage,
  getJoinChannelMessage,
  getHelpMessage,
  getCategoryInfoMessage,
  getMyMagersMessage,
  getDriverMenuMessage,
  getDriverContactMessage,
  getDriverStatusMessage,
};
