import type { NextRequest } from 'next/server';
import { verifyVkMiniAppsSign } from './verify';

export type VkAuthResult =
  | { ok: true; userId: string; raw: Record<string, string>; via: 'vk-params' }
  | { ok: false; error: string };

export function getVkAuthFromRequest(req: NextRequest): VkAuthResult {
  // 1) Берём либо заголовок x-vk-params (middleware его ставит),
  //    либо оригинальную строку query из URL
  const hdr = req.headers.get('x-vk-params') || '';
  const src = hdr || new URL(req.url).search;

  const qs = new URLSearchParams(src.startsWith('?') ? src.slice(1) : src);

  const secure = process.env.VK_SECURE_KEY || '';
  const { ok, data } = verifyVkMiniAppsSign(qs, secure);
  if (!ok || !data) return { ok: false, error: 'BAD_VK_SIGN' };

  const uid = data['vk_user_id'] || '';
  if (!uid) return { ok: false, error: 'NO_VK_USER' };

  return { ok: true, userId: String(uid), raw: data, via: 'vk-params' };
}
