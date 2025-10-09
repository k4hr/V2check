'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function AnimePickerPage() {
  return (
    <AIChatClient
      title="🍥 Выбор аниме"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Предпочитаете сериал или полнометражный фильм? И к какому жанру тянет сейчас?"
      systemPrompt={PROMPT}
      mode="pro-anime"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
