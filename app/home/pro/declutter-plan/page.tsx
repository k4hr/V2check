'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function DeclutterPlanPage() {
  return (
    <AIChatClient
      title="🗑️ Разгрузка и разбор вещей"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какую комнату или зону берём первой?"
      systemPrompt={PROMPT}
      mode="pro-declutter"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
