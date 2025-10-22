/* path: lib/vk/api.ts */
// Утилиты для VK Mini Apps: инициализация vk-bridge, получение api_host,
// вызов методов API через bridge (клиент) и прямой вызов API (сервер).

// ВАЖНО:
// - client-функции используют @vkontakte/vk-bridge и работают ТОЛЬКО в браузере.
// - server-функции НЕ тянут bridge и могут безопасно использовать сервисный токен.

// Минимальные типы ответа VKWebAppGetConfig
export type VkConfig = {
  api_host?: string;               // например: "api.vk.ru"
  app_id?: number;
  appearance?: 'light' | 'dark';
  scheme?: string;
  platform?: string;
  viewport_height?: number;
  viewport_width?: number;
  is_iframe?: boolean;
  supports_vkui?: boolean;
  [k: string]: any;
};

type Bridge = {
  send<T = any>(method: string, params?: Record<string, any>): Promise<T>;
  subscribe(cb: (e: any) => void): void;
};

const V = '5.199'; // версия VK API по умолчанию

const cache = {
  apiHost: 'https://api.vk.ru',
  config: null as VkConfig | null,
};

// --------- CLIENT (browser) ---------

let bridgePromise: Promise<Bridge> | null = null;

async function getBridge(): Promise<Bridge> {
  if (typeof window === 'undefined') {
    throw new Error('vk-bridge is client-only');
  }
  if (bridgePromise) return bridgePromise;

  bridgePromise = (async () => {
    const mod = await import('@vkontakte/vk-bridge');
    const bridge = (mod.default || mod) as Bridge;

    // Инициализация Mini App
    try { await bridge.send('VKWebAppInit'); } catch {}

    // Подпишемся на обновления окружения, чтобы следить за api_host
    try {
      bridge.subscribe((e: any) => {
        const type = e?.detail?.type;
        const data = e?.detail?.data;
        if (type === 'VKWebAppUpdateConfig' && data) {
          const apiHost = normalizeApiHost(data.api_host);
          if (apiHost) cache.apiHost = apiHost;
          // appearance / scheme можно применять здесь, если нужно
        }
      });
    } catch {}

    return bridge;
  })();

  return bridgePromise;
}

function normalizeApiHost(api_host?: string): string | null {
  if (!api_host) return null;
  const host = String(api_host).replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
  return host ? `https://${host}` : null;
}

/** Получить/обновить конфиг VK Mini Apps (VKWebAppGetConfig) */
export async function getVkConfig(force = false): Promise<VkConfig | null> {
  if (typeof window === 'undefined') return null;
  if (cache.config && !force) return cache.config;

  const bridge = await getBridge();
  const cfg = await bridge.send<VkConfig>('VKWebAppGetConfig');
  cache.config = cfg;

  const apiHost = normalizeApiHost(cfg?.api_host);
  if (apiHost) cache.apiHost = apiHost;

  return cache.config;
}

/** Текущий API host для запросов (по возможности — из GetConfig/UpdateConfig) */
export async function getApiHost(): Promise<string> {
  if (typeof window === 'undefined') {
    // На сервере используем переменную или дефолт
    return (process.env.VK_API_HOST || 'https://api.vk.ru').replace(/\/+$/g, '');
  }
  try { if (!cache.config) await getVkConfig(); } catch {}
  return cache.apiHost.replace(/\/+$/g, '');
}

/** Получить пользовательский токен (если нужно звать методы от имени юзера) */
export async function getAuthToken(scope: string | string[]): Promise<string> {
  const appId = Number(process.env.NEXT_PUBLIC_VK_APP_ID || 0);
  if (!appId) throw new Error('NEXT_PUBLIC_VK_APP_ID is not set');

  const bridge = await getBridge();
  const scopeStr = Array.isArray(scope) ? scope.join(',') : String(scope || '');
  const res = await bridge.send<{ access_token: string }>('VKWebAppGetAuthToken', {
    app_id: appId,
    scope: scopeStr,
  });
  if (!res?.access_token) throw new Error('VKWebAppGetAuthToken failed');
  return res.access_token;
}

/** Вызов метода VK API через VKWebAppCallAPIMethod (клиент) */
export async function callApiMethodClient<T = any>(
  method: string,
  params: Record<string, any>
): Promise<T> {
  const bridge = await getBridge();
  const p = { v: V, ...params }; // не забываем версию
  // request_id — опционально, но полезно
  const request_id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const res = await bridge.send<{ response?: T; error?: any }>('VKWebAppCallAPIMethod', {
    method,
    params: p,
    request_id,
  });

  if ((res as any)?.error) {
    const err = (res as any).error;
    throw new Error(`VKWebAppCallAPIMethod error: ${err?.error_msg || JSON.stringify(err)}`);
  }

  // bridge возвращает объект-враппер { response, ... }
  const response = (res as any)?.response ?? res;
  return response as T;
}

// --------- SERVER (Node only) ---------

/**
 * Прямой вызов метода VK API с сервера.
 * НЕ вызывается на клиенте. Для сервисных методов передай opts.service=true
 * или явно укажи accessToken.
 */
export async function callApiMethodServer<T = any>(
  method: string,
  params: Record<string, any> = {},
  opts?: {
    apiHost?: string;        // переопределить хост (обычно не нужно)
    accessToken?: string;    // явный токен (user/group/service)
    service?: boolean;       // взять сервисный токен из VK_SERVICE_TOKEN
    timeoutMs?: number;      // таймаут запроса
  }
): Promise<T> {
  if (typeof window !== 'undefined') {
    throw new Error('callApiMethodServer must be used on server only');
  }

  const apiHost =
    (opts?.apiHost || process.env.VK_API_HOST || 'https://api.vk.ru').replace(/\/+$/g, '');

  const access_token =
    opts?.accessToken ||
    (opts?.service ? process.env.VK_SERVICE_TOKEN : undefined);

  if (!access_token) {
    throw new Error('ACCESS_TOKEN_REQUIRED (pass accessToken or set service=true with VK_SERVICE_TOKEN)');
  }

  const body = new URLSearchParams();
  body.set('v', V);
  body.set('access_token', access_token);
  for (const [k, v] of Object.entries(params || {})) {
    if (v === undefined || v === null) continue;
    body.set(k, String(v));
  }

  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), Math.max(3_000, opts?.timeoutMs ?? 10_000));

  let resp: Response;
  try {
    resp = await fetch(`${apiHost}/method/${encodeURIComponent(method)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(to);
  }

  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`VK API HTTP ${resp.status}: ${JSON.stringify(json)}`);
  }

  if (json.error) {
    // Формат ошибки VK API
    const e = json.error;
    const msg = `VK API error ${e?.error_code}: ${e?.error_msg || 'Unknown error'}`;
    throw new Error(msg);
  }

  return (json.response ?? json) as T;
}

// --------- Вспомогательное ---------

/** Признак запуска внутри VK (по наличию bridge / launchParams) */
export function isRunningInVk(): boolean {
  if (typeof window === 'undefined') return false;
  // vk-bridge добавляет window.vkBridge
  if ((window as any).vkBridge) return true;
  // либо наличие vk_* параметров в location.hash / search
  const search = `${location.search}${location.hash}`;
  return /[?#]vk_/i.test(search);
}

/** Принудительно обновить cached apiHost (например, из серверного пререндера) */
export function setApiHost(host: string) {
  const norm = normalizeApiHost(host);
  if (norm) cache.apiHost = norm;
}

/** Отдать текущий cached apiHost синхронно (без гарантий) */
export function peekApiHost(): string {
  return cache.apiHost;
}
