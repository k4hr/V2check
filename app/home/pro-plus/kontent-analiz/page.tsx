/* path: app/home/pro-plus/kontent-analiz/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function KontentAnalizPage() {
  return (
    <AIChatClientPro
      title="💡 Контент-анализ"
      subtitle="Супер-идеи под ваш контент: темы, рубрики, крючки, форматы."
      initialAssistant={
        'Где и что вы уже публикуете (Telegram/Instagram/TikTok/YouTube/VK/другое)? Дайте ссылки. Если ничего не ведёте — опишите интересы, сильные стороны и тип личности; сколько времени готовы уделять в неделю.'
      }
      systemPrompt={PROMPT}
      mode="kontent-analiz"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
