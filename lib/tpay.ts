// lib/tpay.ts
import crypto from 'crypto';
import { dispatcherFor } from '@/lib/proxy';

type Dict = Record<string, any>;

/** Нормализация базового URL API — всегда HTTPS и c /v2 на конце */
function normalizeApiBase(input?: string | null): string {
  let s = (input || '').trim();
  if (!s) return 'https://securepay.tinkoff.ru/v2';
  if (s.startsWith('//')) s = 'https:' + s;
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  s = s.replace(/\/+$/g, '');
  if (/\/v2$/i.test(s)) return s;
  return s + '/v2';
}

// дефолт явно без /v2 — normalizeApiBase добавит
export const API_BASE = normalizeApiBase(
  process.env.TINKOFF_API || process.env.TINKOFF_API_URL || 'https://securepay.tinkoff.ru'
);

const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY!;
const PASSWORD     = process.env.TINKOFF_PASSWORD!;

export type TinkoffInitReq = {
  Amount: number;         // копейки
  OrderId: string;
  Description?: string;
  SuccessURL?: string;
  FailURL?: string;
  [k: string]: any;
};

export type TinkoffInitRes = {
  Success: boolean;
  PaymentId?: number;
  PaymentURL?: string;
  ErrorCode?: string;
  Message?: string;
  Details?: string;
  [k: string]: any;
};

export function makeToken(params: Dict): string {
  const excluded = new Set(['Token', 'Receipt', 'DATA']);
  const entries = Object.entries(params)
    .filter(([k, v]) => !excluded.has(k) && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b, 'en'));
  const concat = entries.map(([, v]) => String(v)).join('') + PASSWORD;
  return crypto.createHash('sha256').update(concat).digest('hex');
}

async function call<T>(path: string, body: Dict): Promise<T> {
  const url = `${API_BASE.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  const payload = { ...body, TerminalKey: TERMINAL_KEY };
  const Token = makeToken(payload);

  // ключ: добавляем dispatcher только для tinkoff/tbank
  const dispatcher = dispatcherFor(url);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, Token }),
    cache: 'no-store',
    // @ts-ignore — у fetch(undici) есть опция dispatcher
    dispatcher,
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    console.error('[TPAY CALL FAIL]', { url, status: res.status, text });
    throw new Error(`Tinkoff ${path} HTTP ${res.status}: ${text}`);
  }

  return (json ?? ({} as any)) as T;
}

export async function tpayInit(req: TinkoffInitReq) {
  return call<TinkoffInitRes>('Init', req);
}

export async function tpayGetState(paymentId: string | number) {
  return call('GetState', { PaymentId: paymentId });
}

export function verifyWebhookToken(body: Dict): boolean {
  try {
    const token = String(body?.Token || '');
    const calc  = makeToken(body);
    return token === calc;
  } catch {
    return false;
  }
}

export function ensureEnv() {
  if (!TERMINAL_KEY || !PASSWORD) {
    throw new Error('TINKOFF_TERMINAL_KEY / TINKOFF_PASSWORD отсутствуют');
  }
}
