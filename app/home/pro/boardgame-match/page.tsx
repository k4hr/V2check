'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function BoardgameMatchPage() {
  return (
    <AIChatClient
      title="🎲 Настолка на вечер"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Сколько игроков будет и какого возраста?"
      systemPrompt={PROMPT}
      mode="pro-boardgame"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
