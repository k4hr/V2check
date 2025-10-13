/* path: app/home/pro-plus/vizovy-pomoshchnik/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function VisaAssistantPage() {
  return (
    <AIChatClientPro
      title="🛂 Визовый помощник"
      subtitle="Тип визы, документы, сроки, шаги записи и подачи."
      initialAssistant="Куда и на сколько дней планируете поездку? Ваше гражданство/паспорт? Если есть приглашение/бронь — прикрепите."
      systemPrompt={PROMPT}
      mode="vizovy-pomoshchnik"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
