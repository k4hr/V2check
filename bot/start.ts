// bot/start.ts
import { Telegraf } from 'telegraf';

const BOT_TOKEN   = process.env.TG_BOT_TOKEN!;
const APP_ORIGIN  = process.env.APP_ORIGIN!; // "https://v2check-production.up.railway.app" (без хвоста /)
const bot = new Telegraf(BOT_TOKEN);

bot.start(async (ctx) => {
  const uid = String(ctx.from?.id ?? '');
  const payload = (ctx.startPayload && ctx.startPayload.trim()) || `u${uid}`;

  // Откроется ТОЛЬКО внутри Telegram (inline web_app button)
  // Пробрасываем id и ref — твой фронт уже умеет их читать
  const webAppUrl = `${APP_ORIGIN}/tg?id=${encodeURIComponent(uid)}&ref=${encodeURIComponent(payload)}`;

  const text =
`Hi! I’m your personal assistant in Telegram.

🚀 Inside: smart tools for everyday life:
• planning, health, and home
• content, writing, and ideas
• money, shopping, and walks

Tap the button to open the app — let’s go!`;

  await ctx.reply(text, {
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🚀 Open the app', web_app: { url: webAppUrl } }],
      ],
    },
  });
});

bot.launch();
