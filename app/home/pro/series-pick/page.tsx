'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function SeriesPickPage() {
  return (
    <AIChatClient
      title="📺 Сериал за выходные"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какие сериалы вам нравились в последнее время?"
      systemPrompt={PROMPT}
      mode="pro-series"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
