'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function PostureBreakPage() {
  return (
    <AIChatClient
      title="🧍 Перерыв для осанки"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="Где вы сейчас — офис, дом или дорога?"
      systemPrompt={PROMPT}
      mode="pro-posture"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
