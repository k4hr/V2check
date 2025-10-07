'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function Page() {
  return (
    <AIChatClient
      title="🧽 Быстрая уборка дома"
      subtitle="Чисто и быстро? Организуем!"
      initialAssistant="Какие комнаты приоритетны и сколько времени есть (мин)? Есть ли дети/питомцы/ограничения по шуму?"
      systemPrompt={PROMPT}
      mode="pro-cleaning"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
