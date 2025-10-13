/* path: app/home/pro-plus/treid-analiz/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function TreidAnalizPage() {
  return (
    <AIChatClientPro
      title="📊 Трейд-анализ"
      subtitle="Стратегии, риск-менеджмент, точки входа/выхода."
      initialAssistant={
        'Что вы торгуете и на каком рынке? Если есть скриншоты сделок или статистика — прикрепите.'
      }
      systemPrompt={PROMPT}
      mode="treid-analiz"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
