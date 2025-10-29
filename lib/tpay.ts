// lib/tpay.ts
import crypto from 'crypto';

/** Нормализация базового URL API — всегда HTTPS и c /v2 на конце */
function normalizeApiBase(input?: string | null): string {
  let s = (input || '').trim();

  // дефолт
  if (!s) return 'https://securepay.tinkoff.ru/v2';

  // протокол-relative -> https
  if (s.startsWith('//')) s = 'https:' + s;

  // без схемы -> https://
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;

  // убираем хвостовые слэши
  s = s.replace(/\/+$/g, '');

  // если уже есть /v2 — оставим один
  if (/\/v2$/i.test(s)) return s;

  return s + '/v2';
}

// Поддерживаем оба имени переменной на всякий случай
const API_BASE = normalizeApiBase(process.env.TINKOFF_API || process.env.TINKOFF_API_URL);

// ОБЯЗАТЕЛЬНЫЕ креды
const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY!;
const PASSWORD     = process.env.TINKOFF_PASSWORD!;

type Dict = Record<string, any>;

type TinkoffInitReq = {
  Amount: number;      // в копейках
  OrderId: string;
  Description?: string;
  SuccessURL?: string;
  FailURL?: string;
  [k: string]: any;    // Receipt и пр.
};

type TinkoffInitRes = {
  Success: boolean;
  PaymentId?: number;
  PaymentURL?: string;
  ErrorCode?: string;
  Message?: string;
  Details?: string;
  [k: string]: any;
};

/** Формирование токена по правилам Tinkoff */
export function makeToken(params: Dict): string {
  const excluded = new Set(['Token', 'Receipt', 'DATA']);
  const entries = Object.entries(params)
    .filter(([k, v]) => !excluded.has(k) && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b, 'en'));
  const concat = entries.map(([, v]) => String(v)).join('') + PASSWORD;
  return crypto.createHash('sha256').update(concat).digest('hex');
}

/** Универсальный POST к Tinkoff API */
async function call<T>(path: string, body: Dict): Promise<T> {
  // API_BASE уже оканчивается на /v2 — делаем “/v2/<Path>”
  const url = `${API_BASE.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;

  const payload = { ...body, TerminalKey: TERMINAL_KEY };
  const Token = makeToken(payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, Token }),
    cache: 'no-store',
  });

  const text = await res.text();
  let json: any;
  try { json = JSON.parse(text); } catch { json = null; }

  if (!res.ok) {
    // небольшой лог поможет ловить конфиги/URL
    console.error('[TPAY CALL FAIL]', { url, status: res.status, text });
    throw new Error(`Tinkoff ${path} HTTP ${res.status}: ${text}`);
  }

  return (json ?? ({} as any)) as T;
}

/** Инициализация платежа — строго /v2/Init */
export async function tpayInit(req: TinkoffInitReq) {
  return call<TinkoffInitRes>('Init', req);
}

/** Получение статуса — /v2/GetState */
export async function tpayGetState(paymentId: string | number) {
  return call('GetState', { PaymentId: paymentId });
}

/** Проверка подписи в вебхуках */
export function verifyWebhookToken(body: Dict): boolean {
  try {
    const token = String(body?.Token || '');
    const calc  = makeToken(body);
    return token === calc;
  } catch {
    return false;
  }
}

/** Быстрая проверка обязательных env */
export function ensureEnv() {
  if (!TERMINAL_KEY || !PASSWORD) {
    throw new Error('Tinkoff env vars missing: TINKOFF_TERMINAL_KEY / TINKOFF_PASSWORD');
  }
}
