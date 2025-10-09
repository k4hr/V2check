'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function ReviewPage() {
  return (
    <AIChatClient
      title="💬 Отзыв"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Какой характер отзыва нужен: положительный, отрицательный или нейтральный (средний)?"
      systemPrompt={PROMPT}
      mode="pro-review"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
