'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

type Country = {
  code: string;
  name: string;
  flag: string; // emoji
};

type StarStatus = 'yes' | 'partial' | 'no';

const COUNTRIES: Country[] = [
  // СНГ/соседи
  { code: 'RU', name: 'Россия',       flag: '🇷🇺' },
  { code: 'BY', name: 'Беларусь',     flag: '🇧🇾' },
  { code: 'UA', name: 'Украина',      flag: '🇺🇦' },
  { code: 'KZ', name: 'Казахстан',    flag: '🇰🇿' },
  { code: 'UZ', name: 'Узбекистан',   flag: '🇺🇿' },
  { code: 'KG', name: 'Киргизия',     flag: '🇰🇬' },
  { code: 'TJ', name: 'Таджикистан',  flag: '🇹🇯' },
  { code: 'TM', name: 'Туркменистан', flag: '🇹🇲' },
  { code: 'AM', name: 'Армения',      flag: '🇦🇲' },
  { code: 'AZ', name: 'Азербайджан',  flag: '🇦🇿' },
  { code: 'GE', name: 'Грузия',       flag: '🇬🇪' },
  { code: 'MD', name: 'Молдова',      flag: '🇲🇩' },
  { code: 'LV', name: 'Латвия',       flag: '🇱🇻' },
  { code: 'LT', name: 'Литва',        flag: '🇱🇹' },
  { code: 'EE', name: 'Эстония',      flag: '🇪🇪' },
  { code: 'MN', name: 'Монголия',     flag: '🇲🇳' },
  { code: 'TR', name: 'Турция',       flag: '🇹🇷' },

  // Персидский залив / Ближний Восток
  { code: 'AE', name: 'ОАЭ',          flag: '🇦🇪' },
  { code: 'SA', name: 'Саудовская Аравия', flag: '🇸🇦' },
  { code: 'QA', name: 'Катар',        flag: '🇶🇦' },
  { code: 'KW', name: 'Кувейт',       flag: '🇰🇼' },
  { code: 'BH', name: 'Бахрейн',      flag: '🇧🇭' },
  { code: 'OM', name: 'Оман',         flag: '🇴🇲' },
  { code: 'JO', name: 'Иордания',     flag: '🇯🇴' },
  { code: 'LB', name: 'Ливан',        flag: '🇱🇧' },
  { code: 'EG', name: 'Египет',       flag: '🇪🇬' },
  { code: 'IL', name: 'Израиль',      flag: '🇮🇱' },

  // Южная/ЮВА
  { code: 'IN', name: 'Индия',        flag: '🇮🇳' },
  { code: 'PK', name: 'Пакистан',     flag: '🇵🇰' },
  { code: 'BD', name: 'Бангладеш',    flag: '🇧🇩' },
  { code: 'ID', name: 'Индонезия',    flag: '🇮🇩' },
  { code: 'MY', name: 'Малайзия',     flag: '🇲🇾' },
  { code: 'PH', name: 'Филиппины',    flag: '🇵🇭' },
  { code: 'VN', name: 'Вьетнам',      flag: '🇻🇳' },
  { code: 'TH', name: 'Таиланд',      flag: '🇹🇭' },
  { code: 'SG', name: 'Сингапур',     flag: '🇸🇬' },

  // Восточная/Центральная Европа
  { code: 'PL', name: 'Польша',       flag: '🇵🇱' },
  { code: 'CZ', name: 'Чехия',        flag: '🇨🇿' },
  { code: 'SK', name: 'Словакия',     flag: '🇸🇰' },
  { code: 'HU', name: 'Венгрия',      flag: '🇭🇺' },
  { code: 'RO', name: 'Румыния',      flag: '🇷🇴' },
  { code: 'BG', name: 'Болгария',     flag: '🇧🇬' },
  { code: 'RS', name: 'Сербия',       flag: '🇷🇸' },

  // ЛатАм
  { code: 'BR', name: 'Бразилия',     flag: '🇧🇷' },
  { code: 'MX', name: 'Мексика',      flag: '🇲🇽' },
  { code: 'AR', name: 'Аргентина',    flag: '🇦🇷' },

  // Северная Америка — добавили США
  { code: 'US', name: 'США',          flag: '🇺🇸' },
];

// Примерная карта статусов по странам (см. комментарий в сообщении):
function starStatusByCountry(code: string): StarStatus {
  const YES = new Set([
    'US','TR','KZ','AM','AZ','GE','AE','SA','QA','KW','BH','OM','JO','IL','EG',
    'IN','ID','MY','PH','VN','TH','SG',
    'PL','CZ','SK','HU','RO','BG','RS',
    'BR','MX','AR'
  ]);
  const PARTIAL = new Set(['UA','PK','BD','MD','LV','LT','EE','KG','UZ','TJ','TM','MN']);
  const NO = new Set(['RU','BY']);

  if (YES.has(code)) return 'yes';
  if (NO.has(code)) return 'no';
  if (PARTIAL.has(code)) return 'partial';
  return 'partial';
}

function StatusPill({ code }: { code: string }) {
  const s = starStatusByCountry(code);
  const style: React.CSSProperties = {
    fontSize: 12,
    padding: '2px 8px',
    borderRadius: 999,
    border: '1px solid',
    whiteSpace: 'nowrap',
    opacity: 0.95,
  };
  if (s === 'yes') return <span style={{ ...style, borderColor: 'rgba(255,255,255,.35)' }}>⭐ Оплата звёздами доступна</span>;
  if (s === 'partial') return <span style={{ ...style, borderColor: 'rgba(255,255,255,.25)' }}>⚠️ Возможны ограничения</span>;
  return <span style={{ ...style, borderColor: 'rgba(255,255,255,.25)' }}>⛔ Оплата звёздами затруднена</span>;
}

function CountryGateInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const debugId = sp.get('id') || '';

  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    const w: any = window;
    try { w?.Telegram?.WebApp?.ready?.(); w?.Telegram?.WebApp?.expand?.(); } catch {}
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('juristum.country');
      if (saved) setSelected(saved);
    } catch {}
  }, []);

  const onSelect = (code: string) => {
    setSelected(code);
    try {
      localStorage.setItem('juristum.country', code);
      document.cookie = `country=${code}; path=/; max-age=${60 * 60 * 24 * 365}`;
    } catch {}
  };

  const goNext = () => {
    const suffix = debugId ? `?id=${encodeURIComponent(debugId)}` : '';
    router.push((`/home${suffix}`) as any);
  };

  const canContinue = useMemo(() => Boolean(selected), [selected]);

  return (
    <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'start center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 520, marginTop: 28 }}>
        <div style={{ display: 'grid', placeItems: 'center', marginBottom: 18 }}>
          <img src="/logo.png" alt="Juristum" width={140} height={140} style={{ borderRadius: 24, objectFit: 'contain' }} />
        </div>

        <h1 style={{ textAlign: 'center', margin: '4px 0 14px', fontSize: 24 }}>Выберите вашу страну</h1>

        <div className="card" style={{ padding: 12, borderRadius: 16 }}>
          <div style={{ display: 'grid', gap: 10 }}>
            {COUNTRIES.map((c) => {
              const active = selected === c.code;
              return (
                <button
                  key={c.code}
                  onClick={() => onSelect(c.code)}
                  className="list-btn"
                  style={{
                    textAlign: 'left',
                    border: active ? '1px solid rgba(255,255,255,.35)' : '1px solid var(--border, #333)',
                    background: active ? 'rgba(255,255,255,.06)' : 'transparent',
                    borderRadius: 14,
                    padding: '12px 14px'
                  }}
                >
                  <span className="list-btn__left">
                    <span className="list-btn__emoji" aria-hidden>{c.flag}</span>
                    <b>{c.name}</b>
                  </span>
                  <span className="list-btn__right" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <StatusPill code={c.code} />
                    {active ? '✓' : <span className="list-btn__chev">›</span>}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 14 }}>
            <button
              disabled={!canContinue}
              onClick={goNext}
              className="list-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '12px 14px', borderRadius: 12, opacity: canContinue ? 1 : 0.6 }}
            >
              Продолжить
            </button>
          </div>

          <p style={{ opacity: 0.65, fontSize: 12, marginTop: 10, textAlign: 'center' }}>
            Статус оплаты ориентировочный. Если у пользователя иностранный Apple/Google Store — Stars всё равно могут работать.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function CountryGatePage() {
  return (
    <Suspense fallback={<main style={{ padding: 20 }}>Загрузка…</main>}>
      <CountryGateInner />
    </Suspense>
  );
}
