/* path: app/home/pro-plus/nalogovy-konsultant/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function TaxConsultantPage() {
  return (
    <AIChatClientPro
      title="🧾 Налоговый консультант"
      subtitle="Налоги и вычеты: режим, сроки, план действий."
      initialAssistant="Ваша страна/регион и статус: наёмный, самозанятый, ИП или ООО? Если есть документы/квитанции — прикрепите."
      systemPrompt={PROMPT}
      mode="nalogovy-konsultant"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
