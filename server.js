const express = require("express");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = (process.env.SITE_URL || "").replace(/\/+$/, "");
const RESOURCE_DIR = path.join(__dirname, "resources");

// Only files explicitly listed here are shown/downloadable.
// Add your own files to /resources and add an entry below.
const RESOURCES = [
  {
    id: "readme",
    title: "Sample resource (instructions)",
    filename: "README.txt",
    description: "A placeholder file showing where to add your own authorized resources."
  }
];

function safeResource(item) {
  const fullPath = path.resolve(RESOURCE_DIR, item.filename);
  return fullPath.startsWith(path.resolve(RESOURCE_DIR) + path.sep) && fs.existsSync(fullPath);
}

function getResources() {
  return RESOURCES.filter(safeResource);
}

app.get("/health", (_req, res) => res.status(200).send("OK"));

app.get("/download/:id", (req, res) => {
  const item = getResources().find(r => r.id === req.params.id);
  if (!item) return res.status(404).send("Không tìm thấy tệp.");
  res.download(path.join(RESOURCE_DIR, item.filename), item.filename);
});

app.get("/", (_req, res) => {
  const items = getResources();
  const cards = items.map(item => `
    <article class="card">
      <div class="file-icon">↧</div>
      <div class="details">
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.description || "")}</p>
        <a class="download" href="/download/${encodeURIComponent(item.id)}">Tải tệp</a>
      </div>
    </article>`).join("");
  res.type("html").send(`<!doctype html>
<html lang="vi"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#101827">
<title>Kho tài nguyên</title>
<style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0b1220;color:#eef2ff;font:16px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
.wrap{max-width:760px;margin:auto;padding:28px 18px 60px}.hero{padding:28px 22px;border:1px solid #26354d;border-radius:22px;background:linear-gradient(135deg,#17243a,#101827)}
.kicker{color:#8bd5ff;font-size:12px;letter-spacing:.15em;text-transform:uppercase;font-weight:700}
h1{font-size:clamp(28px,7vw,42px);line-height:1.12;margin:12px 0}.hero p{color:#bac7dc;margin:0}
.list{display:grid;gap:12px;margin-top:20px}.card{display:flex;gap:15px;align-items:center;background:#121c2c;border:1px solid #26354d;border-radius:16px;padding:16px}
.file-icon{width:48px;height:48px;border-radius:13px;background:#20344c;display:grid;place-items:center;color:#8bd5ff;font-size:27px;flex-shrink:0}
.details{min-width:0;flex:1}h2{font-size:17px;margin:0 0 4px}p{color:#aebbd0;margin:0 0 12px;font-size:14px;overflow-wrap:anywhere}
.download{display:inline-block;padding:9px 14px;border-radius:10px;background:#8bd5ff;color:#081321;text-decoration:none;font-weight:800}
.note{font-size:12px;color:#8190a8;margin-top:22px}.empty{padding:20px;border:1px dashed #41516a;border-radius:14px;color:#bac7dc}
</style></head><body><main class="wrap">
<section class="hero"><div class="kicker">Resource hub</div><h1>Kho tài nguyên của bạn</h1>
<p>Tải xuống các tệp được chủ sở hữu cho phép chia sẻ.</p></section>
<section class="list">${cards || '<div class="empty">Chưa có tệp nào được thêm vào kho.</div>'}</section>
<div class="note">Chỉ chia sẻ tệp bạn sở hữu hoặc được phép phân phối. Trang này không tự sửa đổi ứng dụng hay trò chơi.</div>
</main></body></html>`);
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

app.listen(PORT, () => console.log(`Website listening on ${PORT}`));

if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  bot.onText(/^\/start(?:@\w+)?$/, async (msg) => {
    const chatId = msg.chat.id;
    const keyboard = SITE_URL
      ? { reply_markup: { inline_keyboard: [[{ text: "🌐 Mở kho tài nguyên", url: SITE_URL }]] } }
      : {};
    await bot.sendMessage(chatId,
      "Xin chào! Đây là bot chia sẻ tài nguyên.\n\nDùng /files để xem danh sách tệp hoặc /help để xem hướng dẫn.",
      keyboard);
  });

  bot.onText(/^\/help(?:@\w+)?$/, async (msg) => {
    await bot.sendMessage(msg.chat.id,
      "Lệnh khả dụng:\n/start — Mở menu\n/files — Xem tệp có sẵn\n/get ID — Gửi một tệp cụ thể\n\nVí dụ: /get readme");
  });

  bot.onText(/^\/files(?:@\w+)?$/, async (msg) => {
    const items = getResources();
    if (!items.length) return bot.sendMessage(msg.chat.id, "Kho hiện chưa có tệp.");
    const lines = items.map(item => `• ${item.title}\n  ID: ${item.id}\n  ${item.description || ""}`);
    await bot.sendMessage(msg.chat.id, "Tệp hiện có:\n\n" + lines.join("\n\n"));
  });

  bot.onText(/^\/get(?:@\w+)?(?:\s+([a-zA-Z0-9_-]+))?$/, async (msg, match) => {
    const id = match && match[1];
    if (!id) return bot.sendMessage(msg.chat.id, "Cú pháp: /get ID\nDùng /files để xem ID.");
    const item = getResources().find(r => r.id === id);
    if (!item) return bot.sendMessage(msg.chat.id, "Không tìm thấy ID đó. Dùng /files để xem danh sách.");
    try {
      await bot.sendDocument(msg.chat.id, path.join(RESOURCE_DIR, item.filename), {
        caption: `${item.title}\n${item.description || ""}`
      });
    } catch (err) {
      console.error("Send document failed:", err.message);
      await bot.sendMessage(msg.chat.id, "Không gửi được tệp. Hãy thử lại sau.");
    }
  });

  bot.on("polling_error", (err) => console.error("Telegram polling error:", err.message));
  console.log("Telegram bot polling enabled.");
} else {
  console.log("TELEGRAM_BOT_TOKEN not set; website runs without the bot.");
}
