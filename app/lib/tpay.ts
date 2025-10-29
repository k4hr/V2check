// lib/tpay.ts
import crypto from 'crypto';

/** Нормализация базового URL API — всегда HTTPS и c /v2 на конце */
function normalizeApiBase(input?: string | null): string {
  let s = (input || '').trim();

  // если пусто — дефолт
  if (!s) return 'https://securepay.tinkoff.ru/v2';

  // протокол-Relative -> https
  if (s.startsWith('//')) s = 'https:' + s;

  // если без схемы — добавим https://
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;

  // убираем хвостовые слэши
  s = s.replace(/\/+$/g, '');

  // если уже указан /v2 в конце — оставим один
  if (/\/v2$/i.test(s)) return s;

  return s + '/v2';
}

// Поддержка двух имён переменных на всякий случай
const API_BASE = normalizeApiBase(
  process.env.TINKOFF_API || process.env.TINKOFF_API_URL
);

const TERMINAL_KEY = process.env.TINKOFF_TERMINAL_KEY!;
const PASSWORD     = process.env.TINKOFF_PASSWORD!;

type TinkoffInitReq = {
  Amount: number;      // в копейках
  OrderId: string;
  Description?: string;
  SuccessURL?: string;
  FailURL?: string;
  // Доп. поля (Receipt и пр.) можно прокидывать как есть:
  [k: string]: any;
};

type TinkoffInitRes = {
  Success: boolean;
  PaymentId?: number;
  PaymentURL?: string;
  ErrorCode?: string;
  Message?: string;
  Details?: string;
  // Плюс любые другие поля
  [k: string]: any;
};

type Dict = Record<string, any>;

/** Формирование токена по правилам Tinkoff */
export function makeToken(params: Dict): string {
  // Исключаем Token и "сложные" поля (Receipt/DATA) из подписи
  const excluded = new Set(['Token', 'Receipt', 'DATA']);
  const entries = Object.entries(params)
    .filter(([k, v]) => !excluded.has(k) && v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b, 'en')); // сортировка ключей

  const concat = entries.map(([, v]) => String(v)).join('') + PASSWORD;
  return crypto.createHash('sha256').update(concat).digest('hex');
}

/** Универсальный POST к Tinkoff API */
async function call<T>(path: string, body: Dict): Promise<T> {
  const url =
    API_BASE + (path.startsWith('/') ? path : '/' + path); // API_BASE уже оканчивается на /v2

  const payload = { ...body, TerminalKey: TERMINAL_KEY };
  const Token = makeToken(payload);

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...payload, Token }),
    cache: 'no-store',
  });

  // Иногда сервер возвращает text/plain при ошибке
  const text = await res.text();
  const json = (() => {
    try { return JSON.parse(text); } catch { return null; }
  })();

  if (!res.ok) {
    throw new Error(`Tinkoff ${path} HTTP ${res.status}: ${text}`);
  }

  return (json ?? ({} as any)) as T;
}

/** Инициализация платежа */
export async function tpayInit(req: TinkoffInitReq) {
  return call<TinkoffInitRes>('Init', req);
}

/** Получение статуса платежа */
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
