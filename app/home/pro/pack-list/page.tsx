'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function PackListPage() {
  return (
    <AIChatClient
      title="🧳 Чек-лист в поездку"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Куда и на сколько дней едете?"
      systemPrompt={PROMPT}
      mode="pro-pack"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
