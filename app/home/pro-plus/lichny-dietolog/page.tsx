/* path: app/home/pro-plus/lichny-dietolog/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function LichnyDietologPage() {
  return (
    <AIChatClientPro
      title="🥗 Личный диетолог"
      subtitle="Индивидуальное питание под цель: калории, БЖУ, меню и список покупок."
      initialAssistant={
        'Сколько вам лет и ваш пол (м/ж)? Какая цель: похудение, набор, поддержание или здоровье.\n' +
        'Если есть анализы, дневник питания или фото телосложения — прикрепите.'
      }
      systemPrompt={PROMPT}
      mode="lichny-dietolog"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
