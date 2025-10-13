/* path: app/home/pro-plus/konstruktor-dogovorov/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ContractsBuilderPage() {
  return (
    <AIChatClientPro
      title="📄 Конструктор договоров"
      subtitle="Сгенерирую/проверю договор: риски, пункты, шаблоны."
      initialAssistant="Какой договор нужен и между кем? Кратко условия (предмет, цена, сроки). Приложите черновик/переписку, если есть."
      systemPrompt={PROMPT}
      mode="konstruktor-dogovorov"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
