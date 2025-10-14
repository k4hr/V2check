/* path: app/home/pro-plus/uderzhanie-klientov/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';
import type { Route } from 'next';

export default function Page() {
  return (
    <AIChatClientPro
      title="🧲 Удержание клиентов"
      subtitle="Построим стратегию удержания: сегменты, триггеры, сценарии win-back и метрики успеха."
      initialAssistant="Начнём. 1) Что за продукт/сервис и как вы зарабатываете?"
      systemPrompt={PROMPT}
      mode="uderzhanie-klientov"
      backHref={'/home/pro-plus' as Route}
      maxAttach={10}
      passthroughIdParam
    />
  );
}
