'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function HabitPlanPage() {
  return (
    <AIChatClient
      title="🎯 Привычка за 30 дней"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какую одну привычку хотите внедрить и зачем лично вам это нужно?"
      systemPrompt={PROMPT}
      mode="pro-habit"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
