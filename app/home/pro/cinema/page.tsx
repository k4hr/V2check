// /app/home/pro/cinema/page.tsx
'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function CinemaConcierge() {
  return (
    <AIChatClient
      title="🎬 Подбор фильма/сериала"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Что хотите посмотреть сегодня: фильм или сериал?"
      systemPrompt={PROMPT}        // <- берём из той же папки
      mode="pro-cinema"
      backHref="/home/pro"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
