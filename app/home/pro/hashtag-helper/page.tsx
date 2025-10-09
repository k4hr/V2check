'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function HashtagHelperPage() {
  return (
    <AIChatClient
      title="🏷️ Хэштеги к посту"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) На какой платформе вы публикуете пост и на каком языке он будет?"
      systemPrompt={PROMPT}
      mode="pro-tags"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
