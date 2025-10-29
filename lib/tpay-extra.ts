// lib/tpay-extra.ts
import { makeToken } from './tpay';

const API_BASE = (process.env.TINKOFF_API?.replace(/\/+$/,'') || 'https://securepay.tinkoff.ru') + '/v2';
const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY!;
const PASSWORD = process.env.TINKOFF_PASSWORD!; // нужен для токена через makeToken

export async function callRaw(path: string, body: Record<string, any>) {
  const url = `${API_BASE}/${path.replace(/^\/+/, '')}`;
  const payload = { ...body, TerminalKey: TERMINAL_KEY };
  const Token = makeToken(payload);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, Token }),
    cache: 'no-store',
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Tinkoff ${path} HTTP ${res.status}: ${text}`); }
}
