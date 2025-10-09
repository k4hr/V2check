'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function MindDumpPage() {
  return (
    <AIChatClient
      title="🧠 Разгрузка головы"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Что сейчас сильнее всего занимает голову? Назовите 3–5 мыслей, задач или забот — как идут в голову."
      systemPrompt={PROMPT}
      mode="pro-mental"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
