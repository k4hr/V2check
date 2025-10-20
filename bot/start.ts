// bot/start.ts
import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN  = process.env.TG_BOT_TOKEN!;
const APP_ORIGIN = process.env.APP_ORIGIN!; // e.g. https://v2check-production.up.railway.app

if (!BOT_TOKEN)  throw new Error('TG_BOT_TOKEN is not set');
if (!APP_ORIGIN) throw new Error('APP_ORIGIN is not set');

const WEBAPP_URL = `${APP_ORIGIN}/home`; // Change if needed
const bot = new Telegraf(BOT_TOKEN);

// /start — rich card + "Open in Telegram" button
bot.start(async (ctx) => {
  const caption =
`✨ LiveManager — your daily assistant in Telegram.
Helps with tasks, plans, and ideas — all in one place.

Always here to make your life easier 💙`;

  const kb = Markup.inlineKeyboard([
    Markup.button.webApp('Open LiveManager ❤️', WEBAPP_URL)
  ]);

  try {
    await ctx.replyWithPhoto(
      { url: `${APP_ORIGIN}/og/live-manager.jpg` },
      { caption, ...kb }
    );
  } catch {
    await ctx.reply(caption, kb);
  }
});

// Optional: explicit open command
bot.command('open', (ctx) =>
  ctx.reply('Open the app:', Markup.inlineKeyboard([
    Markup.button.webApp('Open LiveManager ❤️', WEBAPP_URL)
  ]))
);

// Health
bot.command('ping', (ctx) => ctx.reply('pong'));

export async function launchBot() {
  await bot.launch();
  console.log('[bot] started with long polling');
  const stop = async () => {
    try { await bot.stop('SIGTERM'); } catch {}
    process.exit(0);
  };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

if (require.main === module) {
  launchBot().catch((e) => {
    console.error('[bot] failed to start', e);
    process.exit(1);
  });
}
