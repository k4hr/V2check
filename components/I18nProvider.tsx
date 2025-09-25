'use client';

import React, { createContext, useContext, useMemo } from 'react';

export type Dict = Record<string, any>;

type Ctx = {
  t: (key: string, vars?: Record<string, any>) => string;
  messages: Dict;
};

const I18nCtx = createContext<Ctx | null>(null);

// Достаём значение по пути "a.b.c"
function lookup(messages: Dict, key: string): any {
  return key.split('.').reduce((acc: any, k: string) => {
    if (acc == null) return undefined;
    return acc[k];
  }, messages);
}

// Подстановка плейсхолдеров "{var}"
function interpolate(s: string, vars?: Record<string, any>) {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v == null ? '' : String(v);
  });
}

export function I18nProvider({
  messages,
  children,
}: {
  messages: Dict;
  children: React.ReactNode;
}) {
  const value = useMemo<Ctx>(() => {
    return {
      messages,
      t: (key: string, vars?: Record<string, any>) => {
        const v = lookup(messages, key);
        if (v == null) return key;           // fallback: показываем ключ
        if (typeof v === 'string') return interpolate(v, vars);
        return String(v);
      },
    };
  }, [messages]);

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
