'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function ErrandRoutePage() {
  return (
    <AIChatClient
      title="🗺️ Маршрут дел"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Перечислите точки и что нужно сделать в каждой."
      systemPrompt={PROMPT}
      mode="pro-errands"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
