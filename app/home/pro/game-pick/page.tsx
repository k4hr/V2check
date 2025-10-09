'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function GamePickPage() {
  return (
    <AIChatClient
      title="🎮 Подбор видеоигры"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="На какой платформе играете и есть ли активные подписки?"
      systemPrompt={PROMPT}
      mode="pro-game"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
