'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function HealthVisitPage() {
  return (
    <AIChatClient
      title="🩺 К визиту к врачу"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) К какому врачу вы идёте и что больше всего беспокоит сейчас?"
      systemPrompt={PROMPT}
      mode="pro-health-visit"
      backHref="/home/pro"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
