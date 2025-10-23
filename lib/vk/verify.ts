import crypto from 'crypto';

export type VkLaunchParams = Record<string, string>;

function toBase64Url(buf: Buffer) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Проверяет подпись launch-параметров VK Mini Apps.
 * @param params URLSearchParams со всеми query (включая sign)
 * @param secureKey VK_SECURE_KEY из настроек приложения (секретное слово)
 */
export function verifyVkMiniAppsSign(params: URLSearchParams, secureKey: string): { ok: boolean; data?: VkLaunchParams } {
  if (!secureKey) return { ok: false };

  const data: VkLaunchParams = {};
  const entries: [string, string][] = [];

  params.forEach((v, k) => {
    if (k === 'sign') return;
    if (k.startsWith('vk_')) entries.push([k, v]);
  });

  if (!entries.length) return { ok: false };

  // Сортируем по ключу, собираем строку
  entries.sort(([a], [b]) => a.localeCompare(b));
  const query = entries.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  // HMAC-SHA256 -> base64url
  const hmac = crypto.createHmac('sha256', secureKey).update(query);
  const mySign = toBase64Url(hmac.digest());

  const theirSign = params.get('sign') || '';
  if (mySign !== theirSign) return { ok: false };

  for (const [k, v] of entries) data[k] = v;
  return { ok: true, data };
}
