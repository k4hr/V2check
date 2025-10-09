'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function SnackPairPage() {
  return (
    <AIChatClient
      title="🧀 Закуска к напитку"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="К какому напитку вы хотите подобрать закуску?"
      systemPrompt={PROMPT}
      mode="pro-snackpair"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
