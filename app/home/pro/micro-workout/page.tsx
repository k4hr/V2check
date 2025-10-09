'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function MicroWorkoutPage() {
  return (
    <AIChatClient
      title="🏋️ Тренировка 10–20 минут"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какова главная цель короткой тренировки сегодня?"
      systemPrompt={PROMPT}
      mode="pro-workout-mini"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
