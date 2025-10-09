'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function MealPlanMiniPage() {
  return (
    <AIChatClient
      title="🍽️ Меню на день"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Сколько приёмов пищи планируете сегодня и завтра?"
      systemPrompt={PROMPT}
      mode="pro-meal-mini"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
