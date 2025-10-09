'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function CityDayPage() {
  return (
    <AIChatClient
      title="🗓️ Город за 1 день"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="В какой город и в какой день вы приедете, и во сколько уезжаете?"
      systemPrompt={PROMPT}
      mode="pro-city-day"
      backHref="/home/pro"
      maxAttach={0}
      passthroughIdParam
    />
  );
}
