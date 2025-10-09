'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function BookPickPage() {
  return (
    <AIChatClient
      title="📚 Подбор книги"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Назовите 2–3 любимые книги или авторов, которые вам точно зашли."
      systemPrompt={PROMPT}
      mode="pro-book"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
