// lib/tpay.ts
import crypto from 'crypto';

const API = process.env.TINKOFF_API || 'https://securepay.tinkoff.ru';
const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY!;
const PASSWORD = process.env.TINKOFF_PASSWORD!;

type TinkoffInitReq = {
  Amount: number;           // в копейках
  OrderId: string;
  Description?: string;
  SuccessURL?: string;
  FailURL?: string;
};

type TinkoffInitRes = {
  Success: boolean;
  PaymentId?: number;
  PaymentURL?: string;
  ErrorCode?: string;
  Message?: string;
  Details?: string;
};

type Dict = Record<string, any>;

/** Формирование токена по правилам Tinkoff */
export function makeToken(params: Dict): string {
  // Исключаем Token и "сложные" поля (Receipt/DATA) из подписи.
  const excluded = new Set(['Token', 'Receipt', 'DATA']);
  const entries = Object.entries(params)
    .filter(([k, v]) => !excluded.has(k) && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b, 'en'));
  const concat = entries.map(([, v]) => String(v)).join('') + PASSWORD;
  return crypto.createHash('sha256').update(concat).digest('hex');
}

async function call<T>(path: string, body: Dict): Promise<T> {
  const url = `${API}/v2/${path}`;
  const payload = { ...body, TerminalKey: TERMINAL_KEY };
  const Token = makeToken(payload);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, Token }),
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Tinkoff ${path} HTTP ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function tpayInit(req: TinkoffInitReq) {
  return call<TinkoffInitRes>('Init', req);
}

export async function tpayGetState(paymentId: string | number) {
  return call('GetState', { PaymentId: paymentId });
}

/** Проверка подписи в вебхуке */
export function verifyWebhookToken(body: Dict): boolean {
  try {
    const token = String(body?.Token || '');
    const calc = makeToken(body);
    return token === calc;
  } catch {
    return false;
  }
}

export function ensureEnv() {
  if (!TERMINAL_KEY || !PASSWORD) {
    throw new Error('Tinkoff env vars missing: TINKOFF_TERMINAL_KEY / TINKOFF_PASSWORD');
  }
}
