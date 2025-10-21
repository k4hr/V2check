// bot/start.ts
import { Telegraf, Markup } from 'telegraf';

const BOT_TOKEN  = process.env.TG_BOT_TOKEN!;
const APP_ORIGIN = process.env.APP_ORIGIN!; // напр. https://v2check-production.up.railway.app

if (!BOT_TOKEN)  throw new Error('TG_BOT_TOKEN is not set');
if (!APP_ORIGIN) throw new Error('APP_ORIGIN is not set');

const WEBAPP_URL = `${APP_ORIGIN}/home`;
const bot = new Telegraf(BOT_TOKEN);

// /start — карточка + кнопка «Открыть»
bot.start(async (ctx) => {
  const caption =
`✨ LiveManager — ваш ежедневный ассистент в Telegram.
Помогает с задачами, планами и идеями — всё в одном месте.

Всегда рядом, чтобы сделать жизнь проще 💙`;

  const kb = Markup.inlineKeyboard([
    Markup.button.webApp('Открыть LiveManager ❤️', WEBAPP_URL)
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

// /open — явная команда открыть мини-апп
bot.command('open', (ctx) =>
  ctx.reply('Открыть приложение:', Markup.inlineKeyboard([
    Markup.button.webApp('Открыть LiveManager ❤️', WEBAPP_URL)
  ]))
);

// /support — поддержка
bot.command('support', (ctx) =>
  ctx.reply('При возникновении каких либо проблем — обращайтесь @seimngr')
);

// /ping — проверка живости
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
