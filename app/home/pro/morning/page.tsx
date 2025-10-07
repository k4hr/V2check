'use client';

import AIChatClient from '@/lib/tma/AIChatClient';
import PROMPT from './prompt';

export default function MorningRoutine() {
  return (
    <AIChatClient
      title="🌅 Утренний ритуал"
      subtitle="Опишите запрос — подберу последовательность на 20–30 минут."
      initialAssistant="Сколько времени есть сегодня: 5, 10 или 20–30 минут? И какой эффект хотите — энергия, спокойствие или фокус?"
      systemPrompt={PROMPT}       // <- промпт из этой же папки
      mode="pro-morning"
      backHref="/home/pro"
      maxAttach={10}              // можно поставить 0, если вложения не нужны
      passthroughIdParam
    />
  );
}
