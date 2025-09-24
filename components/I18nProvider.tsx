'use client';
import React, {createContext, useContext, ReactNode, useMemo} from 'react';

type Dict = Record<string, string>;

type Ctx = {
  messages: Dict;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({messages, children}: {messages: Dict; children: ReactNode}) {
  const value = useMemo<Ctx>(() => ({
    messages,
    t: (key, vars) => {
      let out = messages[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp('{' + k + '}', 'g'), String(v));
        }
      }
      return out;
    }
  }), [messages]);
  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error('I18nProvider missing');
  return ctx;
}
