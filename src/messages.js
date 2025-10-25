const { CONFIG } = require("./config");
const { getUserPosts } = require("./database");

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatCurrency(amount) {
  return rupiahFormatter.format(amount);
}

function formatUsernameDisplay(username) {
  if (!username) {
    return "-";
  }
  return username.startsWith("@") ? username : `@${username}`;
}

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
    `<b>Username:</b> ${formatUsernameDisplay(driver.username)}`,
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

function getDriverLookupPromptMessage() {
  return [
    "🚗 <b>Check Driver</b>",
    "",
    "Masukkan <b>username</b> (contoh: <code>@driver123</code>) atau <b>nama lengkap</b> calon driver.",
    "Ketik <b>BATAL</b> untuk membatalkan.",
  ].join("\n");
}

function getDriverLookupResultMessage(query, matches, contactUsername) {
  if (!matches || matches.length === 0) {
    return [
      "🚗 <b>Hasil Check Driver</b>",
      "",
      `Pencarian: <b>${query}</b>`,
      "",
      "Status: <b>Tidak ditemukan / tidak terdaftar</b>",
      `Silakan hubungi admin driver di <b>${contactUsername}</b> bila perlu verifikasi lebih lanjut.`,
    ].join("\n");
  }

  const lines = [
    "🚗 <b>Hasil Check Driver</b>",
    "",
    `Pencarian: <b>${query}</b>`,
    "",
    `Ditemukan ${matches.length} driver aktif:`,
    "",
  ];

  matches.forEach((driver, index) => {
    const summary = driver.ratingSummary;
    const ratingText = summary && summary.total > 0
      ? `Rating: ${summary.average?.toFixed(2) || "0.00"} (${summary.total} penilaian)`
      : "Belum ada rating";
    lines.push(
      `${index + 1}. <b>${driver.fullName || "-"}</b> (${formatUsernameDisplay(driver.username)})${
        driver.expiresAt ? ` • Berlaku sampai ${formatDateTimeId(driver.expiresAt)}` : ""
      }`
    );
    lines.push(`   ${ratingText}`);
  });

  lines.push("", "Gunakan menu Rating > Beri Rating untuk memberikan penilaian.");
  return lines.join("\n");
}

function getRatingTargetPromptMessage() {
  return [
    "⭐ <b>Beri Rating</b>",
    "",
    "Masukkan <b>username</b> (contoh: <code>@user123</code>) atau nama lengkap pengguna yang ingin Anda rating.",
    "Tidak dapat memberi rating untuk diri sendiri.",
    "Ketik <b>BATAL</b> untuk membatalkan.",
  ].join("\n");
}

function getRatingAmbiguousMessage(matches) {
  const lines = [
    "⭐ <b>Pencarian Tidak Spesifik</b>",
    "",
    "Kami menemukan beberapa pengguna. Silakan kirim ulang dengan username yang lebih spesifik:",
    "",
  ];

  matches.forEach((user, index) => {
    lines.push(`${index + 1}. <b>${user.fullName || "-"}</b> (${formatUsernameDisplay(user.username)})`);
  });

  return lines.join("\n");
}

function getRatingScorePromptMessage(targetDisplay) {
  return [
    "⭐ <b>Pilih Rating</b>",
    "",
    `Target: <b>${targetDisplay}</b>`,
    "",
    "Pilih skor 1-5 (1 = buruk, 5 = sangat baik).",
  ].join("\n");
}

function getRatingCommentPromptMessage(targetDisplay) {
  return [
    "📝 <b>Tambah Ulasan</b>",
    "",
    `Target: <b>${targetDisplay}</b>`,
    "",
    "Kirim ulasan singkat (opsional).",
    "Ketik <b>-</b> untuk melewati atau <b>BATAL</b> untuk membatalkan.",
  ].join("\n");
}

function getRatingThankYouMessage(targetDisplay, summary) {
  const lines = [
    "✅ <b>Rating Tersimpan</b>",
    "",
    `Anda telah memberikan rating untuk <b>${targetDisplay}</b>.`,
  ];

  if (summary && summary.total > 0) {
    lines.push(
      "",
      `⭐ Rata-rata: <b>${summary.average?.toFixed(2) || "0.00"}</b> dari ${summary.total} penilaian.`
    );
  }


  lines.push("", "Gunakan menu Rating > Beri Rating untuk memberikan penilaian.");
  return lines.join("\n");
}

function getRatingLookupPromptMessage() {
  return [
    "⭐ <b>Check Rating Pengguna</b>",
    "",
    "Masukkan username atau nama pengguna yang ingin Anda cek rating-nya.",
    "Catatan: untuk rating driver gunakan menu Check Driver.",
    "Ketik <b>BATAL</b> untuk membatalkan.",
  ].join("\n");
}

function getRatingLookupResultMessage(query, user, summary, contactUsername) {
  if (!user) {
    return [
      "⭐ <b>Hasil Check Rating</b>",
      "",
      `Pencarian: <b>${query}</b>`,
      "",
      "Status: <b>Pengguna belum terdaftar</b>",
      `Jika ini calon driver, gunakan fitur Check Driver atau hubungi <b>${contactUsername}</b>.`,
    ].join("\n");
  }

  const lines = [
    "⭐ <b>Hasil Check Rating</b>",
    "",
    `Pengguna: <b>${user.fullName || "-"}</b> (${formatUsernameDisplay(user.username)})`,
  ];

  if (summary && summary.total > 0) {
    lines.push(
      `Rata-rata: <b>${summary.average?.toFixed(2) || "0.00"}</b> dari ${summary.total} penilaian.`
    );
  } else {
    lines.push("Belum ada rating yang tercatat.");
  }

  return lines.join("\n");
}

function formatPostSummary(post) {
  const posted = formatTimestamp(post.timestamp);
  const expires = post.expiresAt ? formatDateTimeId(post.expiresAt) : null;
  let summary = `${post.category} • ${posted}`;
  if (expires) {
    summary += `\nKadaluarsa: ${expires}`;
  }
  return summary;
}

function getClosePostsMessage(posts) {
  if (!posts || posts.length === 0) {
    return "Tidak ada posting aktif yang dapat ditutup.";
  }

  let message = "🔒 <b>Tutup Posting</b>\n\nPilih posting yang ingin ditutup:\n\n";
  posts.forEach((post, index) => {
    message += `${index + 1}. ${formatPostSummary(post)}\n\n`;
  });
  message += "Sentuh salah satu tombol di bawah untuk menutup posting.";
  return message;
}

function getEditPostsMessage(posts) {
  if (!posts || posts.length === 0) {
    return "Tidak ada posting aktif yang dapat diedit.";
  }

  let message = "✏️ <b>Edit Posting</b>\n\nPilih posting yang ingin diperbarui:\n\n";
  posts.forEach((post, index) => {
    message += `${index + 1}. ${formatPostSummary(post)}\n\n`;
  });
  message += "Sentuh salah satu tombol di bawah untuk mengedit isi posting.";
  return message;
}

function getEditPostInstructionMessage(post) {
  const contentPreview = post.message ? post.message.slice(0, 200) : "(tidak ada isi)";
  return [
    "✏️ <b>Edit Posting</b>",
    "",
    `Kategori: <b>${post.category}</b>`,
    post.expiresAt ? `Kadaluarsa: ${formatDateTimeId(post.expiresAt)}` : null,
    "",
    "<b>Isi saat ini:</b>",
    contentPreview,
    "",
    "Kirim teks pengganti untuk memperbarui posting ini.",
    "Ketik <b>BATAL</b> untuk membatalkan.",
  ]
    .filter(Boolean)
    .join("\n");
}

function getPriceDistancePromptMessage() {
  return [
    "💰 <b>Hitung Ongkos</b>",
    "",
    "Masukkan jarak tempuh dalam meter (contoh: <code>1500</code>).",
    "Ketik <b>BATAL</b> untuk membatalkan.",
  ].join("\n");
}

function getPriceWeatherPromptMessage(distanceMeters) {
  return [
    "🌦️ Apakah saat ini hujan?",
    "",
    `Jarak: <b>${distanceMeters} meter</b>`,
    "",
    "Pilih salah satu opsi di bawah.",
  ].join("\n");
}

function getPriceResultMessage({ distance, baseFare, stepFare, steps, isRain, total }) {
  const lines = [
    "💸 <b>Estimasi Ongkos</b>",
    "",
    `Jarak: <b>${distance} meter</b>`,
    `Kondisi: <b>${isRain ? "Hujan" : "Tidak hujan"}</b>`,
    "",
    `Biaya dasar: ${formatCurrency(baseFare)}`,
    `Kelipatan 500m (${steps}x): ${formatCurrency(stepFare * steps)}`,
    "",
    `Total: <b>${formatCurrency(total)}</b>`,
  ];

  return lines.join("\n");
}

module.exports = {
  formatTimestamp,
  formatDateTimeId,
  formatCurrency,
  getWelcomeMessage,
  getJoinChannelMessage,
  getHelpMessage,
  getCategoryInfoMessage,
  getMyMagersMessage,
  getDriverMenuMessage,
  getDriverContactMessage,
  getDriverStatusMessage,
  getDriverLookupPromptMessage,
  getDriverLookupResultMessage,
  getRatingTargetPromptMessage,
  getRatingAmbiguousMessage,
  getRatingScorePromptMessage,
  getRatingCommentPromptMessage,
  getRatingThankYouMessage,
  getRatingLookupPromptMessage,
  getRatingLookupResultMessage,
  getClosePostsMessage,
  getEditPostsMessage,
  getEditPostInstructionMessage,
  getPriceDistancePromptMessage,
  getPriceWeatherPromptMessage,
  getPriceResultMessage,
};
