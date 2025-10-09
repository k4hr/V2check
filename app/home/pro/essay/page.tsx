'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function EssayPage() {
  return (
    <AIChatClient
      title="✍️ Эссе/сочинение"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какая тема эссе и для какой аудитории это нужно?"
      systemPrompt={PROMPT}
      mode="pro-essay"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
