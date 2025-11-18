'use client';

import ChatGPTPage from '../ChatGPT/page';
import { Msg } from '../ChatGPT/page';
import { Locale, readLocale } from '@/lib/i18n';

/*
  Это лёгкий враппер, который:
  - меняет заголовок на "GEMINI 3 PRO"
  - подменяет ответ на вопросы "какая модель"
  - оставляет весь функционал ChatGPT-страницы как есть
*/

export default function GeminiPage() {
  const locale: Locale = readLocale();

  // Патчим главные строки под Gemini
  (globalThis as any).__GEMINI_TITLE__ = 'GEMINI 3 PRO';
  (globalThis as any).__GEMINI_SUBTITLE__ =
    locale === 'en'
      ? 'Advanced multimodal AI by Google'
      : 'Продвинутый мультимодальный ИИ от Google';

  // Патчим ответ на вопросы про модель
  (globalThis as any).__GEMINI_MODEL_ANSWER__ =
    locale === 'en'
      ? 'I am Gemini 3 Pro — a cutting-edge multimodal AI model developed by Google.'
      : 'Я — Gemini 3 Pro, продвинутая мультимодальная модель ИИ, разработанная Google.';

  return <GeminiProxy />;
}

/* -----------------------------  
   Прокси над обычным ChatGPTPage
-------------------------------- */

function GeminiProxy() {
  const locale: Locale = readLocale();

  const askIsModelQuestion = (raw: string) => {
    const s = raw.toLowerCase();
    return (
      s.includes('какая ты модель') ||
      s.includes('что ты за модель') ||
      s.includes('какая модель') ||
      s.includes('верс') ||
      s.includes('gpt') ||
      s.includes('gemini') ||
      s.includes('ии') ||
      s.includes('ai model') ||
      s.includes('what model') ||
      s.includes('which model') ||
      s.includes('version')
    );
  };

  // Захватываем ChatGPT-компонент и патчим его send()
  return (
    <ChatGPTPage
      overrideTitle={(globalThis as any).__GEMINI_TITLE__}
      overrideSubtitle={(globalThis as any).__GEMINI_SUBTITLE__}
      interceptSend={async (text: string) => {
        if (askIsModelQuestion(text)) {
          return {
            ok: true,
            answer: (globalThis as any).__GEMINI_MODEL_ANSWER__,
            images: [],
          };
        }
        return null; // обычный запрос → ChatGPT 5
      }}
    />
  );
}
