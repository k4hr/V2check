// lib/ai.ts

export type ChatContentBlock =
  | { type: 'text'; text: string }
  | { type: 'input_image'; image_url: { url: string } };

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | ChatContentBlock[];
};

// --- Конфиг через ENV с фолбэками ---
const PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const API_KEY =
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY || // фолбэк на старое имя
  '';

const BASE_URL =
  process.env.AI_BASE_URL ||
  (PROVIDER === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');

const DEFAULT_MODEL =
  process.env.AI_MODEL ||
  process.env.OPENAI_MODEL || // фолбэк на старое имя
  'gpt-4o-mini';

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 60_000);
const TEMP = Number(process.env.AI_TEMP ?? 0.2);
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 800);

export async function askAI(
  messages: ChatMessage[],
  opts?: { model?: string }
) {
  if (!API_KEY) throw new Error('AI_API_KEY_MISSING');

  const model = opts?.model || DEFAULT_MODEL;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
  // OpenRouter требует реферер/титул, если вдруг переедем
  if (PROVIDER === 'openrouter') {
    headers['HTTP-Referer'] = process.env.AI_REFERRER || 'https://juristum.app';
    headers['X-Title'] = 'Juristum';
  }

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers,
    signal: ctrl.signal,
    body: JSON.stringify({
      model,
      messages,
      temperature: TEMP,
      max_tokens: MAX_TOKENS,
    }),
  }).finally(() => clearTimeout(t));

  // стараемся вытащить json-ошибку; если не получилось — текст
  let data: any = null;
  try { data = await res.json(); } catch {
    try { data = { raw: await res.text() }; } catch {}
  }

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      (typeof data === 'string' ? data : JSON.stringify(data)) ||
      `HTTP_${res.status}`;
    throw new Error(`AI_HTTP_${res.status}: ${msg}`);
  }

  const text = data?.choices?.[0]?.message?.content ?? '';
  return String(text);
}
