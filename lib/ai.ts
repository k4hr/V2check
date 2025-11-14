/** Универсальные типы нашего приложения */
export type ChatContentBlock =
  | { type: 'text'; text: string }
  | { type: 'input_image'; image_url: { url: string } };

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string | ChatContentBlock[];
};

/* ================= ENV/CONFIG ================= */

const PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase(); // 'openai' | 'openrouter'
const API_KEY =
  process.env.AI_API_KEY ||
  process.env.OPENAI_API_KEY ||
  '';

const BASE_URL =
  process.env.AI_BASE_URL ||
  (PROVIDER === 'openrouter' ? 'https://openrouter.ai/api/v1' : 'https://api.openai.com/v1');

const USE_RESPONSES =
  (process.env.AI_USE_RESPONSES ??
    (PROVIDER === 'openai' ? '1' : '0')) === '1';

const DEFAULT_MODEL =
  process.env.AI_MODEL ||
  process.env.OPENAI_MODEL ||
  'gpt-4o-mini'; // free по умолчанию

const TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 60_000);
const TEMP       = Number(process.env.AI_TEMP ?? 0.2);
const MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 800);

/* =============== КОНВЕРТ МЕССЕДЖЕЙ =============== */

function ensureBlocks(content: string | ChatContentBlock[]): ChatContentBlock[] {
  if (Array.isArray(content)) return content;
  const text = (content ?? '').toString();
  return [{ type: 'text', text }];
}

/** Для Responses API — ВАЖНО: input_text / input_image */
function toResponsesInput(messages: ChatMessage[]) {
  return (messages || []).map(m => ({
    role: m.role,
    content: ensureBlocks(m.content).map(b =>
      b.type === 'input_image'
        ? { type: 'input_image', image_url: { url: b.image_url.url } }
        : { type: 'input_text', text: b.text } // ← ключевая правка
    )
  }));
}

/** Для Chat Completions */
function toChatCompletionsMessages(messages: ChatMessage[]) {
  return (messages || []).map(m => {
    const blocks = ensureBlocks(m.content).map(b =>
      b.type === 'input_image'
        ? ({ type: 'image_url', image_url: { url: b.image_url.url } } as const)
        : ({ type: 'text', text: b.text } as const)
    );
    const content =
      blocks.length === 1 && blocks[0].type === 'text'
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

function isEndpointMismatch(status: number, data: any): boolean {
  if (status === 404 || status === 415 || status === 422) return true;
  const msg = String(data?.error?.message || data?.message || '').toLowerCase();
  if (status === 400 && (
      /unrecognized type/.test(msg) ||
      /input_text/.test(msg) ||
      /use .*chat\.completions/.test(msg) ||
      /use .*responses/.test(msg)
    )) return true;
  return false;
}

function extractTextFromResponses(data: any): string {
  if (typeof data?.output_text === 'string') return data.output_text;
  const out = Array.isArray(data?.output) ? data.output : [];
  const pieces: string[] = [];
  for (const ch of out) {
    const content = Array.isArray(ch?.content) ? ch.content : [];
    for (const c of content) {
      const v =
        (typeof c?.text?.value === 'string' && c.text.value) ? c.text.value :
        (typeof c?.text === 'string' ? c.text : '');
      if (v) pieces.push(v);
    }
  }
  return pieces.join('\n').trim();
}

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
    const responsesUrl = `${BASE_URL}/responses`;
    const chatUrl      = `${BASE_URL}/chat/completions`;

    const responsesBody: any = {
      model,
      input: toResponsesInput(messages),
      temperature: TEMP,
      max_output_tokens: MAX_TOKENS,
    };

    // Для Chat Completions параметр зависит от провайдера
    const chatBody: any = {
      model,
      messages: toChatCompletionsMessages(messages),
      temperature: TEMP,
      ...(PROVIDER === 'openrouter'
        ? { max_tokens: MAX_TOKENS }          // OpenRouter
        : { max_completion_tokens: MAX_TOKENS } // OpenAI новые модели
      ),
    };

    if (USE_RESPONSES && PROVIDER === 'openai') {
      const r = await fetch(responsesUrl, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(responsesBody),
        signal: ctrl.signal,
      });
      const data = await safeReadBody(r);

      if (r.ok) return extractTextFromResponses(data);

      if (isEndpointMismatch(r.status, data)) {
        const r2 = await fetch(chatUrl, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(chatBody),
          signal: ctrl.signal,
        });
        const data2 = await safeReadBody(r2);
        if (!r2.ok) {
          const msg =
            data2?.error?.message ||
            (typeof data2 === 'string' ? data2 : JSON.stringify(data2)) ||
            `HTTP_${r2.status}`;
          throw new Error(`AI_HTTP_${r2.status}: ${msg}`);
        }
        return extractTextFromChatCompletions(data2);
      }

      const msg =
        data?.error?.message ||
        (typeof data === 'string' ? data : JSON.stringify(data)) ||
        `HTTP_${r.status}`;
      throw new Error(`AI_HTTP_${r.status}: ${msg}`);
    }

    // Сразу Chat Completions
    const rc = await fetch(chatUrl, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(chatBody),
      signal: ctrl.signal,
    });
    const dataC = await safeReadBody(rc);
    if (!rc.ok) {
      const msg =
        dataC?.error?.message ||
        (typeof dataC === 'string' ? dataC : JSON.stringify(dataC)) ||
        `HTTP_${rc.status}`;
      throw new Error(`AI_HTTP_${rc.status}: ${msg}`);
    }
    return extractTextFromChatCompletions(dataC);
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
