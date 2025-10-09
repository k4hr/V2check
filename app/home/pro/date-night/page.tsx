'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function DateNightPage() {
  return (
    <AIChatClient
      title="💞 Свидание-план"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Когда планируете свидание и сколько времени есть?"
      systemPrompt={PROMPT}
      mode="pro-date"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
