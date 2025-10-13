/* path: app/home/pro-plus/reshenie-zadach/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ReshenieZadachPage() {
  return (
    <AIChatClientPro
      title="🧮 Решение задач"
      subtitle="Математика, физика и другие дисциплины — аккуратный разбор и понятное решение."
      initialAssistant="Пришлите условие задачи (текстом или фото/скрином). Что требуется найти/доказать?"
      systemPrompt={PROMPT}
      mode="reshenie-zadach"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
