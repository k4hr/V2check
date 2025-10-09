'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function PlaylistMoodPage() {
  return (
    <AIChatClient
      title="🎧 Плейлист под настроение"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какое настроение или задача у плейлиста и на сколько минут он нужен?"
      systemPrompt={PROMPT}
      mode="pro-playlist"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
