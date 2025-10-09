'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function WaterTrackerPage() {
  return (
    <AIChatClient
      title="💧 Вода на день"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Сколько воды обычно выпиваете в день?"
      systemPrompt={PROMPT}
      mode="pro-water"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
