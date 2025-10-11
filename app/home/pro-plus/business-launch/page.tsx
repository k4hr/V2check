// app/home/pro-plus/business-launch/page.tsx
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function BusinessLaunchPage() {
  return (
    <AIChatClientPro
      title="🚀 Бизнес: запуск"
      subtitle="От идеи до MVP: гипотезы, юнит-экономика, чек-листы."
      initialAssistant="Какие у вас мысли? Что вам нравится?"
      systemPrompt={PROMPT}
      mode="business-launch"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
