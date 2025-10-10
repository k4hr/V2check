'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ProPlusChatPage() {
  return (
    <AIChatClientPro
      title="⚖️ Юрист-помощник"
      subtitle="Решу любую твою проблему."
      initialAssistant={
        'Что у вас произошло? Сейчас во всём разберёмся.\n' +
        'Также, если есть какая-либо документация — прикрепляйте к сообщению.'
      }
      systemPrompt={PROMPT}
      mode="legal-full-one-shot"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
