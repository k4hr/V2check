/* path: app/home/pro-plus/lichny-stilist-pricheska/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function HairStylistPage() {
  return (
    <AIChatClientPro
      title="💇 Личный стилист: прическа"
      subtitle="Подберу стрижку и укладку по фото: форма лица, стиль, уход."
      initialAssistant={
        'Прикрепите 1–3 фото лица (анфас и профиль) при дневном свете без фильтров. Вы мужчина/женщина? Опишите текущую длину и тип волос (прямые/волнистые/кудрявые), желаемый образ и ограничения по уходу.'
      }
      systemPrompt={PROMPT}
      mode="lichny-stilist-pricheska"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
