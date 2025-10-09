'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function ChooseBetweenPage() {
  return (
    <AIChatClient
      title="⚖️ Выбор между вариантами"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Между чем у вас выбор?"
      systemPrompt={PROMPT}
      mode="pro-compare"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
