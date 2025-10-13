/* path: app/home/pro-plus/lichny-stilist-odezhda/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ClothesStylistPage() {
  return (
    <AIChatClientPro
      title="🧥 Личный стилист: одежда"
      subtitle="Стиль и капсула под вас: фасоны, цвета, сочетания, магазины."
      initialAssistant={
        'Прикрепите 2–4 фото в полный рост (спереди/профиль) при дневном свете без фильтров и 3–5 вещей из вашего гардероба. ' +
        'Расскажите: ваши цели (офис, повседневно, мероприятия), примерный бюджет/любимые бренды, дресс-код/ограничения, ' +
        'рост/вес и текущие размеры (верх/низ/обувь) — по желанию, любимые и нелюбимые цвета. Начнём с этого.'
      }
      systemPrompt={PROMPT}
      mode="lichny-stilist-odezhda"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
