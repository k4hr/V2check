/* path: app/home/pro-plus/pomoshchnik-rukovoditelya/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function Page() {
  return (
    <AIChatClientPro
      title="🧑‍💼 Помощник руководителя"
      subtitle="Приоритизация, календарь, протоколы встреч, письма и контроль задач."
      initialAssistant="Какие 3 главных результата вы хотите получить на этой неделе?"
      systemPrompt={PROMPT}
      mode="pomoshchnik-rukovoditelya"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
