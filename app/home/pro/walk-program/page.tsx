'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function WalkProgramPage() {
  return (
    <AIChatClient
      title="🚶 План прогулок"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Какова ваша главная цель на ближайшие 4 недели: шаги в день, минуты быстрой ходьбы, дистанция или улучшение самочувствия/веса?"
      systemPrompt={PROMPT}
      mode="pro-walk"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
