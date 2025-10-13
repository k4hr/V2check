/* path: app/home/pro-plus/planirovanie-beremennosti/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function PreconceptionPlanningPage() {
  return (
    <AIChatClientPro
      title="🤰 Планирование беременности"
      subtitle="Подготовка к зачатию: здоровье, анализы, витамины, образ жизни."
      initialAssistant={
        'Сколько вам лет? Если есть недавние анализы/заключения — прикрепите, пожалуйста.'
      }
      systemPrompt={PROMPT}
      mode="planirovanie-beremennosti"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
