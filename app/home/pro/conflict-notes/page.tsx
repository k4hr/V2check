'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function ConflictNotesPage() {
  return (
    <AIChatClient
      title="🕊️ Разбор конфликта"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Опишите ситуацию кратко: кто участники, когда и где это произошло, что стало триггером?"
      systemPrompt={PROMPT}
      mode="pro-conflict"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
