'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function EventToastPage() {
  return (
    <AIChatClient
      title="🥂 Тост/речь к событию"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какой повод и кто вы для главного героя/героев события?"
      systemPrompt={PROMPT}
      mode="pro-toast"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
