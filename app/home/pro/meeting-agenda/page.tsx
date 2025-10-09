'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function MeetingAgendaPage() {
  return (
    <AIChatClient
      title="📝 Повестка встречи"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какова главная цель встречи одним предложением?"
      systemPrompt={PROMPT}
      mode="pro-agenda"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
