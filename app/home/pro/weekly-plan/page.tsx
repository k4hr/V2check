'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function Page() {
  return (
    <AIChatClient
      title="📆 План на неделю"
      subtitle="Повысь свою полезность до максимума."
      initialAssistant="Какова главная цель недели и 3 ключевые области внимания: работа, личное, здоровье?"
      systemPrompt={PROMPT}
      mode="pro-week"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
