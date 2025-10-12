/* path: app/home/pro-plus/lichny-finansovy-sovetnik/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function FinanceAdvisorPage() {
  return (
    <AIChatClientPro
      title="💰 Личный финансовый советник"
      subtitle="Бюджет, инвестиции, долги: план на месяц/год, риски и цели."
      initialAssistant="Какова ваша главная финансовая цель сейчас (накопить/закрыть долги/инвестировать/оптимизировать бюджет)?"
      systemPrompt={PROMPT}
      mode="lichny-finansovy-sovetnik"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
