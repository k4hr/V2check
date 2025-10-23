/* path: lib/vk/api.ts */
/**
 * Утилиты для VK Mini Apps:
 * - клиент: инициализация vk-bridge, чтение api_host из GetConfig/UpdateConfig/окружения,
 *   вызовы API через VKWebAppCallAPIMethod (с токеном пользователя по необходимости)
 * - сервер: прямые вызовы API на api.vk.ru (или переопределённый хост) с сервисным токеном
 *
 * ВАЖНО:
 * - client-функции работают ТОЛЬКО в браузере
 * - server-функции ТОЛЬКО на сервере (Node) и безопасно берут VK_SERVICE_TOKEN из .env, если передано service:true
 */

export type VkConfig = {
  api_host?: string;               // напр.: "api.vk.ru"
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
  unsubscribe?(cb: (e: any) => void): void;
};

export const VK_API_VERSION = '5.199';

const cache = {
  apiHost: 'https://api.vk.ru', // дефолт; переопределится из GetConfig/куки/окружения
  config: null as VkConfig | null,
};

// ------------- helpers (общие) -------------

function normalizeApiHost(api_host?: string): string | null {
  if (!api_host) return null;
  const host = String(api_host).replace(/^https?:\/\//i, '').replace(/\/+$/g, '');
  return host ? `https://${host}` : null;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

// При загрузке на клиенте — попробуем сразу подхватить api_host,
// который выставляет наш VKBootstrap (window.__VK_API_HOST и кука vk_api_host)
if (typeof window !== 'undefined') {
  try {
    const fromWin = (window as any).__VK_API_HOST as string | undefined;
    const fromCookie = readCookie('vk_api_host') || undefined;
    const normWin = normalizeApiHost(fromWin);
    const normCookie = normalizeApiHost(fromCookie);
    if (normWin) cache.apiHost = normWin;
    else if (normCookie) cache.apiHost = normCookie;
  } catch { /* no-op */ }
}

// ------------- CLIENT (browser) -------------

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

    // Подписка на обновление окружения (смена api_host/темы и т.п.)
    try {
      const handler = (e: any) => {
        const type = e?.detail?.type;
        const data = e?.detail?.data;
        if (type === 'VKWebAppUpdateConfig' && data) {
          const apiHost = normalizeApiHost(data.api_host);
          if (apiHost) cache.apiHost = apiHost;
        }
      };
      bridge.subscribe(handler);
      // если доступен unsubscribe — повесим на window, чтобы можно было снять при HMR
      (window as any).__vkBridgeUpdateHandler = handler;
    } catch {}

    return bridge;
  })();

  return bridgePromise;
}

/** Получить/обновить конфиг VK Mini Apps (VKWebAppGetConfig) */
export async function getVkConfig(force = false): Promise<VkConfig | null> {
  if (typeof window === 'undefined') return null;
  if (cache.config && !force) return cache.config;

  const bridge = await getBridge();
  const cfg = await bridge.send<VkConfig>('VKWebAppGetConfig').catch(() => null);
  if (cfg) {
    cache.config = cfg;
    const apiHost = normalizeApiHost(cfg.api_host);
    if (apiHost) cache.apiHost = apiHost;
  }
  return cache.config;
}

/** Текущий API host для запросов на клиенте (учитывает VKBootstrap/куку/GetConfig) */
export async function getApiHost(): Promise<string> {
  if (typeof window === 'undefined') {
    // На сервере — из ENV или дефолт
    const fromEnv = (process.env.VK_API_HOST || '').trim();
    return (fromEnv || 'https://api.vk.ru').replace(/\/+$/g, '');
  }
  // Постараемся подтянуть из конфигурации, если ещё не подтягивали
  try { if (!cache.config) await getVkConfig(); } catch {}
  return cache.apiHost.replace(/\/+$/g, '');
}

/** Получить user access_token через VKWebAppGetAuthToken (если нужны методы от имени пользователя) */
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

/** Вызов метода VK API через VKWebAppCallAPIMethod (клиент).
 *  В params ДОЛЖЕН быть access_token (user/group) — добавляй сам или воспользуйся callApiAsUser().
 */
export async function callApiMethodClient<T = any>(
  method: string,
  params: Record<string, any>
): Promise<T> {
  const bridge = await getBridge();
  const p = { v: VK_API_VERSION, ...params }; // гарантируем версию

  // request_id — полезно для отладки
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

  const response = (res as any)?.response ?? res;
  return response as T;
}

/** Удобный шорткат: сам получит user token с нужным scope и вызовет метод */
export async function callApiAsUser<T = any>(
  method: string,
  params: Record<string, any> = {},
  scope: string | string[] = []
): Promise<T> {
  const token = await getAuthToken(scope);
  return callApiMethodClient<T>(method, { ...params, access_token: token });
}

// ------------- SERVER (Node only) -------------

/**
 * Прямой серверный вызов метода VK API.
 * Для сервисных методов передай opts.service = true (возьмёт VK_SERVICE_TOKEN из ENV),
 * либо явно передай accessToken.
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
  body.set('v', VK_API_VERSION);
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
    const e = json.error;
    const msg = `VK API error ${e?.error_code}: ${e?.error_msg || 'Unknown error'}`;
    throw new Error(msg);
  }

  return (json.response ?? json) as T;
}

/** Удобный шорткат сервера для сервисных методов */
export async function callApiAsService<T = any>(
  method: string,
  params: Record<string, any> = {},
  opts?: Omit<Parameters<typeof callApiMethodServer<T>>[2], 'service'>
): Promise<T> {
  return callApiMethodServer<T>(method, params, { ...opts, service: true });
}

// ------------- Вспомогательное -------------

/** Признак запуска внутри VK (по наличию bridge / launchParams) */
export function isRunningInVk(): boolean {
  if (typeof window === 'undefined') return false;
  if ((window as any).vkBridge) return true;
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
