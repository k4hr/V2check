'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function Page() {
  return (
    <AIChatClient
      title="⏳ Таймблоки дня"
      subtitle="Четкий и структурированный день? Без проблем!"
      initialAssistant="Во сколько старт и конец дня? Назовите 2–3 главных приоритета и запланированные встречи."
      systemPrompt={PROMPT}
      mode="pro-timeblocks"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
