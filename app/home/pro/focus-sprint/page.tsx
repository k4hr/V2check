'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function FocusSprintPage() {
  return (
    <AIChatClient
      title="🚀 Фокус-спринт 25–60"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какая главная задача спринта и как поймёте, что он успешен?"
      systemPrompt={PROMPT}
      mode="pro-focus"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
