'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ProPlusImageGenPage() {
  return (
    <AIChatClientPro
      title="🎨 Генерация изображений"
      subtitle="Опишите задачу — ассистент всё уточнит и поможет."
      initialAssistant="1) Что вы хотите увидеть на изображении? Укажите ключевые объекты/сюжет, стиль и назначение. Если есть референсы — прикрепите."
      systemPrompt={PROMPT}
      mode="proplus-image-gen"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
