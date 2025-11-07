import fs from 'node:fs/promises';

const TOKEN = process.env.BOT_TOKEN;
const GIFT_ID = process.env.GIFT_ID;
const CHANNELS = (process.env.CHANNELS || '').split(',').map(s => s.trim()).filter(Boolean);
const TEXT = process.env.TEXT || '';

if (!TOKEN || !GIFT_ID || CHANNELS.length === 0) {
  console.error('Need BOT_TOKEN, GIFT_ID, CHANNELS, [TEXT]');
  process.exit(1);
}

const api = (m, body) =>
  fetch(`https://api.telegram.org/bot${TOKEN}/${m}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json());

for (const chat_id of CHANNELS) {
  try {
    const res = await api('sendGift', { chat_id, gift_id: GIFT_ID, text: TEXT });
    if (!res.ok) throw new Error(res.description || 'sendGift failed');
    console.log('OK →', chat_id, 'message_id:', res.result?.message_id ?? '-');
    await new Promise(r => setTimeout(r, 1100));
  } catch (e) {
    console.error('FAIL →', chat_id, String(e));
  }
}
