'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function DebtPayoffPage() {
  return (
    <AIChatClient
      title="💳 План закрытия долгов"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Перечислите долги: тип и сумма по каждому."
      systemPrompt={PROMPT}
      mode="pro-debts"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
