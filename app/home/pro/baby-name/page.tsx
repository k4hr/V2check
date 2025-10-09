'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function BabyNamePage() {
  return (
    <AIChatClient
      title="👶 Имя ребёнку"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Нужны мужские, женские или нейтральные варианты (и одно имя или двойное)?"
      systemPrompt={PROMPT}
      mode="pro-baby-name"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
