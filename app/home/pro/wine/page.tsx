'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function WinePage() {
  return (
    <AIChatClient
      title="🍷 Выбор вина 18+"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="В какой вы стране и где планируете покупать — офлайн-магазин или онлайн?"
      systemPrompt={PROMPT}
      mode="pro-wine"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
