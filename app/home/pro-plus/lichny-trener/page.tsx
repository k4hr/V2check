/* path: app/home/pro-plus/lichny-trener/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function LichnyTrenerPage() {
  return (
    <AIChatClientPro
      title="🏋️‍♂️ Личный тренер"
      subtitle="План тренировок, питание, прогресс и техника."
      initialAssistant="Сколько вам лет? Вы мужчина или женщина? Если можете — прикрепите фото тела для анализа."
      systemPrompt={PROMPT}
      mode="lichny-trener"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
