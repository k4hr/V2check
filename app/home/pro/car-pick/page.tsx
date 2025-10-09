'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function CarPickPage() {
  return (
    <AIChatClient
      title="🚗 Авто под бюджет"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какой у вас бюджет и валюта, новый или б/у, и планируете ли кредит/лизинг?"
      systemPrompt={PROMPT}
      mode="pro-car-pick"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
