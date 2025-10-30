// lib/proxy.ts
import { URL } from 'url';
import { ProxyAgent, type Dispatcher } from 'undici';

let tinkoffDispatcher: Dispatcher | null = null;

/** Создаёт и кеширует прокси-агент для Tinkoff */
export function getTinkoffDispatcher(): Dispatcher | null {
  const proxy = process.env.TPAY_PROXY?.trim();
  if (!proxy) return null;

  if (!tinkoffDispatcher) {
    tinkoffDispatcher = new ProxyAgent(proxy, {
      connect: { timeout: 10_000 }, // 10s на CONNECT
    });
  }
  return tinkoffDispatcher;
}

/** Возвращает dispatcher только для tinkoff.ru / tbank.ru */
export function dispatcherFor(url: string): Dispatcher | undefined {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('tinkoff.ru') || u.hostname.endsWith('tbank.ru')) {
      return getTinkoffDispatcher() ?? undefined;
    }
  } catch {}
  return undefined;
}
