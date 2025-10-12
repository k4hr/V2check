/* path: app/home/pro-plus/lichny-psiholog/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function PersonalPsychologistPage() {
  return (
    <AIChatClientPro
      title="🧠 Личный психолог"
      subtitle="Поддержка и КПТ-практики: стресс, тревожность, сон, привычки."
      initialAssistant={
        'Что сейчас больше всего беспокоит? Коротко опишите ситуацию и ваше состояние (стресс/тревожность/апатия/сон).\n' +
        'Если есть записи дневника, трекеры сна/настроения или скриншоты — прикрепите их.'
      }
      systemPrompt={PROMPT}
      mode="lichny-psiholog"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
