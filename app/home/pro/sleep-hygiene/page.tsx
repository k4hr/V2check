'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function SleepHygienePage() {
  return (
    <AIChatClient
      title="😴 Гигиена сна"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Во сколько вы обычно ложитесь спать и во сколько встаёте в будни и выходные?"
      systemPrompt={PROMPT}
      mode="pro-sleep"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
