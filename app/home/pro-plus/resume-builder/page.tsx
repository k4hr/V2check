/* path: app/home/pro-plus/resume-builder/page.tsx */
'use client';

import AIChatClientPro from '@/lib/tma/AIChatClientPro';
import PROMPT from './prompt';

export default function ResumeBuilderPage() {
  return (
    <AIChatClientPro
      title="📝 Составить резюме"
      subtitle="Сильное CV под конкретную вакансию: опыт, достижения, навыки, ATS."
      initialAssistant="Как вас зовут? Если есть старое резюме, ссылка на вакансию или портфолио — прикрепите, пожалуйста."
      systemPrompt={PROMPT}
      mode="resume-builder"
      backHref="/home/pro-plus"
      maxAttach={10}
      passthroughIdParam
    />
  );
}
