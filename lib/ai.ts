/* path: lib/ai.ts */

/** Универсальные типы нашего приложения */
export type ChatContentBlock =
  | { type: 'text'; text: string }
  | { type: 'input_image'; image_url: { url: string } }
  | { type: 'image_url'; image_url: { url: string } }; // совместимость

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  /** Либо сырой текст, либо массив мультимодальных блоков */
  content: string | ChatContentBlock[];
};

/* ================= ENV/CONFIG ================= */

const PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase(); // 'openai' | 'openrouter'
const API_KEY =
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  '';

/** Базовые URL (можно переопределить AI_BASE_URL для прокси) */
const BASE_URL =
  process.env.AI_BASE_URL ||
  (PROVIDER === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');

/** Для OpenAI по умолчанию используем Responses API */
const USE_RESPONSES =
  (process.env.AI_USE_RESPONSES ??
    (PROVIDER === 'openai' ? '1' : '0')) === '1';

/** Фолбэк-модель на случай, если вызов askAI() без явной model */
const DEFAULT_MODEL =
  process.env.AI_MODEL ||
  process.env.OPENAI_MODEL ||
  'gpt-4o-mini'; // Free-предпочтение

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 60_000);
const TEMP       = Number(process.env.AI_TEMP ?? 0.2);
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 800);

/* =============== КОНВЕРТ МЕССЕДЖЕЙ =============== */

function ensureBlocks(content: string | ChatContentBlock[]): ChatContentBlock[] {
  if (Array.isArray(content)) return content;
  const text = (content ?? '').toString();
  return [{ type: 'text', text }];
}

/** Тело для Responses API (OpenAI) */
function toResponsesInput(messages: ChatMessage[]) {
  return (messages || []).map(m => ({
    role: m.role,
    content: ensureBlocks(m.content).map(b => {
      const t = (b as any).type;
      if (t === 'input_image' || t === 'image_url') {
        return { type: 'input_image', image_url: { url: (b as any).image_url.url } };
      }
      return { type: 'text', text: String((b as any).text ?? '') };
    })
  }));
}

/** Тело для Chat Completions (OpenAI legacy / OpenRouter) */
function toChatCompletionsMessages(messages: ChatMessage[]) {
  return (messages || []).map(m => {
    const blocks = ensureBlocks(m.content).map(b => {
      const t = (b as any).type;
      if (t === 'input_image' || t === 'image_url') {
        return { type: 'image_url', image_url: { url: (b as any).image_url.url } } as const;
      }
      return { type: 'text', text: String((b as any).text ?? '') } as const;
    });

    // Chat Completions допускает строку (когда один текстовый блок) или массив частей
    const content =
      blocks.length === 1 && (blocks[0] as any).type === 'text'
        ? (blocks[0] as any).text
        : (blocks as any);

    return { role: m.role, content };
  });
}

/* =============== СЕТЕВЫЕ УТИЛИТЫ =============== */

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  };
  if (PROVIDER === 'openrouter') {
    if (process.env.AI_REFERRER) h['HTTP-Referer'] = process.env.AI_REFERRER;
    if (process.env.AI_TITLE)    h['X-Title']     = process.env.AI_TITLE;
  }
  return h;
}

async function safeReadBody(res: Response) {
  try { return await res.json(); } catch {
    try { return { raw: await res.text() }; } catch { return null; }
  }
}

/** Достаём чистый текст из Responses API */
function extractTextFromResponses(data: any): string {
  if (typeof data?.output_text === 'string') return data.output_text;

  const chunks = Array.isArray(data?.output) ? data.output : [];
  const pieces: string[] = [];
  for (const ch of chunks) {
    const content = Array.isArray(ch?.content) ? ch.content : [];
    for (const c of content) {
      const v = c?.text?.value ?? c?.text ?? '';
      if (typeof v === 'string' && v) pieces.push(v);
    }
  }
  return pieces.join('\n').trim();
}

/** Достаём текст из Chat Completions */
function extractTextFromChatCompletions(data: any): string {
  return String(data?.choices?.[0]?.message?.content ?? '').trim();
}

/* ================= ПУБЛИЧНЫЙ API ================= */

export async function askAI(
  messages: ChatMessage[],
  opts?: { model?: string }
): Promise<string> {
  if (!API_KEY) throw new Error('AI_API_KEY_MISSING');

  const model = (opts?.model || DEFAULT_MODEL).trim();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

  try {
    const url = USE_RESPONSES && PROVIDER === 'openai'
      ? `${BASE_URL}/responses`
      : `${BASE_URL}/chat/completions`;

    const body =
      url.endsWith('/responses')
        ? {
            model,
            input: toResponsesInput(messages),
            temperature: TEMP,
            max_output_tokens: MAX_TOKENS,
          }
        : {
            model,
            messages: toChatCompletionsMessages(messages),
            temperature: TEMP,
            max_tokens: MAX_TOKENS,
          };

    const res = await fetch(url, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });

    const data = await safeReadBody(res);

    if (!res.ok) {
      const msg =
        data?.error?.message ||
        (typeof data === 'string' ? data : JSON.stringify(data)) ||
        `HTTP_${res.status}`;
      throw new Error(`AI_HTTP_${res.status}: ${msg}`);
    }

    const text = url.endsWith('/responses')
      ? extractTextFromResponses(data)
      : extractTextFromChatCompletions(data);

    return text || '';
  } catch (e: any) {
    const status = e?.status || e?.response?.status;
    const detail =
      e?.error?.message ||
      e?.response?.data?.error?.message ||
      e?.message ||
      'unknown';
    if (status) throw new Error(`AI_HTTP_${status}: ${detail}`);
    throw new Error(detail);
  } finally {
    clearTimeout(timer);
  }
}
