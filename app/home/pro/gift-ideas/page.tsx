'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function GiftIdeasPage() {
  return (
    <AIChatClient
      title="🎁 Подарки по интересам"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Кому готовите подарок и к какому поводу? Укажите возраст и ваши отношения."
      systemPrompt={PROMPT}
      mode="pro-gifts"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
