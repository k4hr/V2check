'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function BrandNamePage() {
  return (
    <AIChatClient
      title="🏷️ Название проекта/бренда"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Опишите продукт или сервис одним предложением — какую пользу он даёт?"
      systemPrompt={PROMPT}
      mode="pro-brand-name"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
