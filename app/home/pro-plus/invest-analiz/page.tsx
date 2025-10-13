/* path: app/home/pro-plus/invest-analiz/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function InvestAnalizPage() {
  return (
    <AIChatClientPro
      title="💹 Инвест-анализ"
      subtitle="Портфель, стратегия, риски, ребалансировка."
      initialAssistant="Какая цель и горизонт инвестиций? Валюта и текущая сумма/портфель?"
      systemPrompt={PROMPT}
      mode="invest-analiz"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
