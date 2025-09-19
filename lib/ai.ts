// lib/ai.ts
export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

export async function askAI(messages: ChatMessage[], opts?: { model?: string }) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey) throw new Error('AI_API_KEY_MISSING');

  const model = opts?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini';

  // OpenAI Chat Completions (JSON mode не обязателен здесь)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.2,
      max_tokens: 800,
    }),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`AI_HTTP_${res.status}: ${t}`);
  }
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  return text as string;
}
