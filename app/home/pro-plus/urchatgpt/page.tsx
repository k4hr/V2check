'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ProPlusChatPage() {
  return (
    <AIChatClientPro
      title="🤖 Pro+ чат ИИ (юрид.)"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Это Pro+ Чат ИИ. Опишите вашу ситуацию одним сообщением: кто участники, что произошло, когда, какие суммы/документы и какого результата хотите. Я сразу дам разбор со стратегиями, планом, сроками и шаблонами. Если чего-то не будет хватать — в конце добавлю список уточнений."
      systemPrompt={PROMPT}
      mode="legal-full-one-shot"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
