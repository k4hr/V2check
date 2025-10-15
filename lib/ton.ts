/* path: lib/ton.ts */
import type { Tier, Plan } from '@/lib/pricing';

export const TON_ADDRESS = (process.env.TON_RECEIVE_ADDRESS || 'UQD3cPQVrdaPdHE0Ez6b6Z8e3eLw8Pu8YPu1AKAlRdYq7dIs').trim();
// во что конвертируем “звёзды”: amountTON = stars * MULTIPLIER
export const STARS_TO_TON = Number(process.env.TON_AMOUNT_PER_STAR || process.env.CRYPTO_PAY_AMOUNT_PER_STAR || '0.01');
// допуск по сумме (комиссии/округление), 1% по умолчанию
export const AMOUNT_TOLERANCE = Number(process.env.TON_AMOUNT_TOLERANCE || '0.01'); // 1% = 0.01
// как далеко смотреть назад по времени, в минутах
export const LOOKBACK_MIN = Number(process.env.TON_LOOKBACK_MIN || '1440'); // 24h

const TONAPI_BASE = (process.env.TONAPI_BASE || 'https://tonapi.io').replace(/\/+$/,'');
const TONAPI_KEY  = (process.env.TONAPI_KEY || '').trim();

export function starsToTon(stars: number) {
  const ton = stars * STARS_TO_TON;
  return Number(ton.toFixed(4)); // для ссылки показываем до 4 знаков
}

export function tonToNano(ton: number) {
  // 1 TON = 1e9 nano
  return BigInt(Math.round(ton * 1e9));
}

export function makeTonDeepLink(address: string, amountTon: number, text: string) {
  const nano = tonToNano(amountTon).toString();
  const q = new URLSearchParams();
  if (amountTon > 0) q.set('amount', nano);
  if (text) q.set('text', text);
  return `ton://transfer/${encodeURIComponent(address)}?${q.toString()}`;
}

type Tx = {
  utime?: number;
  hash?: string;
  in_msg?: {
    value?: string | number;
    amount?: string | number;
    msg_data?: { text?: string; comment?: string; body?: { text?: string; comment?: string } } | any;
    message_data?: { text?: string; comment?: string; body?: { text?: string; comment?: string } } | any;
  } | any;
  // Некоторые провайдеры кладут поля на верхний уровень
  msg_data?: { text?: string; comment?: string; body?: { text?: string; comment?: string } } | any;
  message_data?: { text?: string; comment?: string; body?: { text?: string; comment?: string } } | any;
};

export async function fetchIncomingTx(address: string): Promise<Tx[]> {
  const url = `${TONAPI_BASE}/v2/blockchain/getTransactions?account=${encodeURIComponent(address)}&limit=50`;
  const headers: Record<string,string> = {};
  if (TONAPI_KEY) headers['Authorization'] = `Bearer ${TONAPI_KEY}`;
  const r = await fetch(url, { headers, next: { revalidate: 0 } });
  const j = await r.json().catch(() => ({}));
  // TonAPI v2 -> { transactions: [...] }
  const arr: any[] = Array.isArray(j?.transactions) ? j.transactions : Array.isArray(j) ? j : [];
  return arr as Tx[];
}

export function txComment(tx: any): string {
  // Возможные места, где встречается комментарий к транзакции
  const md =
    tx?.in_msg?.msg_data ??
    tx?.in_msg?.message_data ??
    tx?.msg_data ??
    tx?.message_data ??
    {};

  const text =
    md?.text ??
    md?.comment ??
    md?.body?.text ??
    md?.body?.comment ??
    '';

  return String(text || '').trim();
}

export function txAmountTon(tx: Tx): number {
  const v = tx?.in_msg?.value ?? tx?.in_msg?.amount ?? 0;
  const nano = typeof v === 'string' ? Number(v) : Number(v || 0);
  return nano > 0 ? nano / 1e9 : 0;
}

export function txTimeSec(tx: Tx): number {
  return Number(tx?.utime || 0);
}

export function isAmountOk(got: number, need: number) {
  if (need <= 0) return true;
  const tol = Math.max(AMOUNT_TOLERANCE, 0);
  return got + got * tol >= need; // got >= need - tol%
}

export function payloadFor(tier: Tier, plan: Plan, tgId?: string | null) {
  return `subs2:${tier}:${plan}${tgId ? `:${tgId}` : ''}`;
}
