'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function QuickBudgetPage() {
  return (
    <AIChatClient
      title="💸 Быстрый бюджет"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) На какой срок планируем бюджет: неделя, месяц или другой период?"
      systemPrompt={PROMPT}
      mode="pro-budget"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
