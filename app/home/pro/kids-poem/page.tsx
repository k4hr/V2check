'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function KidsPoemPage() {
  return (
    <AIChatClient
      title="🎵 Детский стих или песня"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="О чем будет стих или песня? Напишите тему одной фразой."
      systemPrompt={PROMPT}
      mode="pro-kids-poem"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
