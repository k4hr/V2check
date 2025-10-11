// app/home/pro-plus/marketing/page.tsx
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function MarketingCoachPage() {
  return (
    <AIChatClientPro
      title="📈 Личный маркетолог"
      subtitle="Стратегия продвижения, контент-план, воронки, KPI."
      initialAssistant={
        'Кто вы и что продвигаете? Опишите продукт/услугу, аудиторию, цели (KPI), бюджет и сроки.\n' +
        'Если есть сайт/соцсети/креативы — дайте ссылки или прикрепите.'
      }
      systemPrompt={PROMPT}
      mode="marketing-coach"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
