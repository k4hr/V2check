'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function RapLyricsPage() {
  return (
    <AIChatClient
      title="🎤 Рэп-текст"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="О чём трек? Сформулируйте тему и главный посыл в одной фразе."
      systemPrompt={PROMPT}
      mode="pro-rap"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
