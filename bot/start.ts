  // bot/start.ts
  import { Telegraf, Markup } from 'telegraf';

  const BOT_TOKEN  = process.env.TG_BOT_TOKEN;
  const APP_ORIGIN = (process.env.APP_ORIGIN || '').replace(/\/$/, '');
  const APP_START_PATH = process.env.APP_START_PATH || '/';
  if (!BOT_TOKEN) throw new Error('Missing TG_BOT_TOKEN');
  if (!APP_ORIGIN) throw new Error('Missing APP_ORIGIN');

  const WEBAPP_URL = APP_ORIGIN + APP_START_PATH;

  const bot = new Telegraf(BOT_TOKEN);

  bot.start(async (ctx) => {
    const text =
`✨ LiveManager — your daily assistant in Telegram.

Inside you’ll find smart tools for everyday life:
• planning, health, and home
• content, texts, and ideas
• money, shopping, and walks

Open the app — and let’s roll!`;

    const inline = Markup.inlineKeyboard([
      Markup.button.webApp('Open the App', WEBAPP_URL),
      Markup.button.url('Open in Telegram (fallback)', WEBAPP_URL)
    ]);

    await ctx.reply(text, { reply_markup: inline.reply_markup });
  });

  bot.command('help', (ctx) =>
    ctx.reply('Type /start to get the app button.')
  );

  bot.launch();
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  console.log('Bot is up. WebApp URL:', WEBAPP_URL);
