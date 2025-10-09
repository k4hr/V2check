'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function PetCarePage() {
  return (
    <AIChatClient
      title="🐾 Рутина для питомца"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Кто ваш питомец: собака, кот или другой? Укажите породу (если есть) и возраст."
      systemPrompt={PROMPT}
      mode="pro-pet"
      backHref="/home/pro"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
