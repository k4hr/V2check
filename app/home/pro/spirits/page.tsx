'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function SpiritsPage() {
  return (
    <AIChatClient
      title="🥃 Выбор крепкого алкоголя 18+"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="В какой вы стране и где планируете покупать — офлайн или онлайн?"
      systemPrompt={PROMPT}
      mode="pro-spirits"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
