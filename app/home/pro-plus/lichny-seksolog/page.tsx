/* path: app/home/pro-plus/lichny-seksolog/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function LichnySeksologPage() {
  return (
    <AIChatClientPro
      title="❤️ Личный сексолог"
      subtitle="Деликатные вопросы о близости: коммуникация, либидо, гармония."
      initialAssistant={
        'С какой задачей вы пришли? Коротко опишите ситуацию (без лишних подробностей).\n' +
        'Если уместно — укажите возраст и пол. При наличии рекомендаций врача/анализов можете прикрепить файлы.'
      }
      systemPrompt={PROMPT}
      mode="lichny-seksolog"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
