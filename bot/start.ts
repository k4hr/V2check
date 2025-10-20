// bot/start.ts
import { Telegraf, Markup, Context } from 'telegraf';

const BOT_TOKEN = process.env.TG_BOT_TOKEN;
const APP_ORIGIN = (process.env.APP_ORIGIN || '').replace(/\/+$/, ''); // trim trailing slash
const APP_START_PATH = process.env.APP_START_PATH || '/';              // e.g. "/home" or "/home/pro"

if (!BOT_TOKEN) throw new Error('TG_BOT_TOKEN is required');
if (!APP_ORIGIN) throw new Error('APP_ORIGIN is required');

const APP_URL = `${APP_ORIGIN}${APP_START_PATH}`;

const bot = new Telegraf(BOT_TOKEN);

// Commands in Telegram menu
bot.telegram.setMyCommands([
  { command: 'start', description: 'Start' },
  { command: 'open',  description: 'Open the app' },
]).catch(() => { /* ignore non-fatal */ });

/** Inline keyboard with WebApp button (opens IN Telegram) */
const openKeyboard = Markup.inlineKeyboard([
  Markup.button.webApp('Open the App', APP_URL),
]);

/** English welcome message */
const WELCOME_EN = [
  'Hi! I’m your personal assistant on Telegram.',
  '',
  '🚀 Inside: smart everyday tools:',
  '• planning, health & home',
  '• content, writing & ideas',
  '• money, shopping & walks',
  '',
  'Open the app — let’s go!',
].join('\n');

/** Reply helper */
async function sendWelcome(ctx: Context) {
  // You can localize later based on ctx.from?.language_code if needed
  await ctx.reply(WELCOME_EN, {
    ...openKeyboard,
    disable_web_page_preview: true,
  });
}

// /start handler (supports deep-link payload but we don’t need it yet)
bot.start(async (ctx) => {
  try {
    await sendWelcome(ctx);
  } catch (err) {
    console.error('start handler error:', err);
  }
});

// /open handler
bot.command('open', async (ctx) => {
  try {
    await sendWelcome(ctx);
  } catch (err) {
    console.error('open handler error:', err);
  }
});

// Optional: react to “open” text messages
bot.hears(/^open|app|start$/i, async (ctx) => {
  try {
    await sendWelcome(ctx);
  } catch (err) {
    console.error('hears error:', err);
  }
});

// Optional: receive data from WebApp (window.Telegram.WebApp.sendData)
bot.on('web_app_data', async (ctx) => {
  const raw = ctx.webAppData?.data || '';
  console.log('web_app_data:', raw);
  await ctx.reply('Got it ✅', { disable_web_page_preview: true });
});

// Launch (long polling)
bot.launch()
  .then(() => console.log('Bot is up. WebApp URL:', APP_URL))
  .catch((e) => {
    console.error('Bot launch failed:', e);
    process.exit(1);
  });

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
