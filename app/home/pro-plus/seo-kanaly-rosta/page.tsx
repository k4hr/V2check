/* path: app/home/pro-plus/seo-kanaly-rosta/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function SeoKanalyRostaPage() {
  return (
    <AIChatClientPro
      title="📺 SEO/каналы роста"
      subtitle="YouTube/Shorts/TG: тайтлы, описания, теги и тумбы под CTR."
      initialAssistant="На какую площадку нацелены: YouTube, Shorts или Telegram? Пришлите ссылку на канал/ролик и 1–3 примера. Если есть тумбы — прикрепите изображения."
      systemPrompt={PROMPT}
      mode="seo-kanaly-rosta"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
