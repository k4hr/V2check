'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Plan, Tier } from '@/lib/pricing';
import { getPrices } from '@/lib/pricing';

const DEBUG = process.env.NEXT_PUBLIC_ALLOW_BROWSER_DEBUG === '1';

type CheckResp = { ok: boolean; admin?: boolean; id?: string | null; via?: string; error?: string };
type GrantResp =
  | { ok: true; until: string; tier: Tier; plan: Plan; days: number; userId: string; telegramId: string }
  | { ok: false; error: string; detail?: string };

function haptic(type: 'light' | 'medium' = 'light') {
  try { (window as any)?.Telegram?.WebApp?.HapticFeedback?.impactOccurred?.(type); } catch {}
}

export default function AdminHome() {
  const [allowed, setAllowed] = useState<null | boolean>(null);
  const [info, setInfo] = useState<string>('');

  // форма «выдать подписку»
  const [tgId, setTgId] = useState('');
  const [tier, setTier] = useState<Tier>('PRO');
  const [plan, setPlan] = useState<Plan>('MONTH');
  const [extraDays, setExtraDays] = useState<number>(0);
  const [grantBusy, setGrantBusy] = useState(false);
  const [grantMsg, setGrantMsg] = useState<string | null>(null);

  // === Новые стейты для блока «Автоплатёж — отмена» ===
  const [cancelKey, setCancelKey] = useState('');            // tg id или vk:12345
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const [cancelErr, setCancelErr] = useState<string | null>(null);

  // для браузерного режима
  const debugId = useMemo(() => {
    try {
      const u = new URL(window.location.href);
      const id = u.searchParams.get('id');
      return id && /^\d{3,15}$/.test(id) ? id : '';
    } catch { return ''; }
  }, []);

  async function check() {
    try {
      const headers: Record<string, string> = {};
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      if (initData) headers['x-init-data'] = initData;

      let url = '/api/admin/check';
      if (!initData && DEBUG && debugId) url += `?id=${encodeURIComponent(debugId)}`;

      const r = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      const data: CheckResp = await r.json().catch(() => ({ ok: false }));

      setAllowed(Boolean(data?.admin));
      if (DEBUG) setInfo(`id=${data?.id || 'n/a'} via=${data?.via || 'n/a'} admin=${String(data?.admin)}`);
    } catch {
      setAllowed(false);
      if (DEBUG) setInfo('check error');
    }
  }

  useEffect(() => {
    try { (window as any)?.Telegram?.WebApp?.ready?.(); } catch {}
    check();
  }, [debugId]);

  async function grant() {
    if (!tgId.trim()) {
      setGrantMsg('Укажите Telegram ID пользователя.');
      return;
    }
    setGrantBusy(true);
    setGrantMsg(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      if (initData) headers['x-init-data'] = initData;

      // Передаём debug id как и в /api/admin/check (для браузерного режима)
      const qs = !initData && DEBUG && debugId ? `?id=${encodeURIComponent(debugId)}` : '';

      const res = await fetch(`/api/admin/grant-subscription${qs}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tgId: tgId.trim(), tier, plan, extraDays: Number(extraDays || 0) }),
      });

      const data: GrantResp = await res.json().catch(() => ({ ok: false, error: 'BAD_RESPONSE' } as any));

      if (!data.ok) {
        throw new Error((data as any).error || 'GRANT_FAILED');
      }

      const until = new Date(data.until);
      setGrantMsg(`Готово: выдано ${tier === 'PROPLUS' ? 'Pro+' : 'Pro'} (${plan}) на ${data.days} дн. До ${until.toLocaleDateString()}.`);
      try { haptic('medium'); } catch {}
    } catch (e: any) {
      setGrantMsg(`Ошибка: ${String(e?.message || e)}`);
    } finally {
      setGrantBusy(false);
    }
  }

  // === Функция из твоего блока для отмены автоплатежа ===
  async function cancelAutopay() {
    if (!cancelKey.trim() || cancelBusy) return;
    setCancelBusy(true); setCancelMsg(null); setCancelErr(null);
    try {
      const initData = (window as any)?.Telegram?.WebApp?.initData || '';
      const r = await fetch('/api/admin/autopay/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(initData ? { 'x-init-data': initData } : {}),
        },
        body: JSON.stringify({ key: cancelKey.trim() }),
      });
      const data = await r.json();
      if (!r.ok || !data?.ok) throw new Error(data?.error || 'CANCEL_FAILED');
      haptic('light');
      setCancelMsg(`Ок: автоплатёж выключен. NextAt=${data?.user?.autopayNextAt ?? '—'}`);
    } catch (e: any) {
      setCancelErr(e?.message || 'Ошибка отмены');
    } finally {
      setCancelBusy(false);
    }
  }

  if (allowed === false) {
    return (
      <main className="safe" style={{ padding: 20 }}>
        <p>Доступ запрещён.</p>
        {DEBUG && <p style={{ opacity: .6, fontSize: 12 }}>{info}</p>}
        <Link href={debugId ? { pathname: '/cabinet', query: { id: debugId } } : '/cabinet'} className="list-btn"
          onClick={() => haptic('light')}
          style={{ display: 'inline-flex', marginTop: 12 }}>
          ← В кабинет
        </Link>
      </main>
    );
  }

  if (allowed === null) {
    return (
      <main className="safe" style={{ padding: 20 }}>
        <p>Проверяем доступ…</p>
        {DEBUG && <p style={{ opacity: .6, fontSize: 12 }}>{info}</p>}
      </main>
    );
  }

  const prices = getPrices(tier);
  const baseDays = prices[plan].days;
  const totalDays = baseDays + (Number.isFinite(extraDays) ? Math.max(0, Number(extraDays)) : 0);

  // allowed === true
  return (
    <main className="safe" style={{ padding: 20, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link href={debugId ? { pathname: '/cabinet', query: { id: debugId } } : '/cabinet'} className="list-btn"
          onClick={() => haptic('light')}
          style={{ width: 120, textDecoration: 'none' }}>
          ← Назад
        </Link>
        <h1 style={{ margin: 0 }}>Admin</h1>
      </div>

      {DEBUG && <p style={{ opacity: .6, fontSize: 12 }}>{info}</p>}

      <div style={{ display: 'grid', gap: 10 }}>
        <Link href="/cabinet/admin/users" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left"><span className="list-btn__emoji">👤</span><b>Пользователи</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
        <Link href="/cabinet/admin/payments" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left"><span className="list-btn__emoji">💳</span><b>Платежи</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
        <Link href="/cabinet/admin/metrics" className="list-btn" style={{ textDecoration: 'none' }}>
          <span className="list-btn__left"><span className="list-btn__emoji">📈</span><b>Метрики</b></span>
          <span className="list-btn__right"><span className="list-btn__chev">›</span></span>
        </Link>
      </div>

      {/* === Секция: Выдать подписку === */}
      <section
        style={{
          marginTop: 6, padding: 14, borderRadius: 16,
          background: 'rgba(255,210,120,.10)', border: '1px solid rgba(255,210,120,.30)',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.05)'
        }}
      >
        <h3 style={{ marginTop: 0, marginBottom: 12 }}>Выдать подписку вручную</h3>

        <div style={{ display: 'grid', gap: 10 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ opacity: .85 }}>Telegram ID пользователя</span>
            <input
              value={tgId}
              onChange={(e) => setTgId(e.target.value)}
              placeholder="например, 123456789"
              inputMode="numeric"
              pattern="[0-9]*"
              style={{ height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px', color: 'var(--fg)' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: .85 }}>Тариф</span>
              <select
                value={tier}
                onChange={(e) => { setTier(e.target.value as Tier); }}
                style={{ height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px', color: 'var(--fg)' }}
              >
                <option value="PRO">Pro</option>
                <option value="PROPLUS">Pro+</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <span style={{ opacity: .85 }}>План</span>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as Plan)}
                style={{ height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px', color: 'var(--fg)' }}
              >
                <option value="WEEK">Неделя</option>
                <option value="MONTH">Месяц</option>
                <option value="HALF_YEAR">Полгода</option>
                <option value="YEAR">Год</option>
              </select>
            </label>
          </div>

          <label style={{ display: 'grid', gap: 6 }}>
            <span style={{ opacity: .85 }}>Дополнительно дней (опционально)</span>
            <input
              value={extraDays}
              onChange={(e) => setExtraDays(Number(e.target.value || 0))}
              type="number" min={0}
              placeholder="0"
              style={{ height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px', color: 'var(--fg)' }}
            />
          </label>

          <div style={{ opacity: .8, fontSize: 13 }}>
            Итого будет выдано: <b>{totalDays}</b> дн. (база {baseDays} + доп. {extraDays || 0})
          </div>

          <button
            type="button"
            onClick={grant}
            disabled={grantBusy}
            className="list-btn"
            style={{ padding: '12px 14px', borderRadius: 12, background: '#2a3150', border: '1px solid #4b57b3', fontWeight: 800 }}
          >
            {grantBusy ? 'Выдаём…' : 'Выдать подписку'}
          </button>

          {!!grantMsg && <div style={{ marginTop: 4, fontSize: 14 }}>{grantMsg}</div>}
        </div>
      </section>

      {/* === НОВАЯ СЕКЦИЯ: Автоплатёж — отмена === */}
      <section
        style={{
          display: 'grid', gap: 10, padding: 14, borderRadius: 16,
          border: '1px solid rgba(120,170,255,.25)',
          background: 'radial-gradient(140% 140% at 10% 0%, rgba(120,170,255,.14), rgba(255,255,255,.03))',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.04)'
        }}
      >
        <h3 style={{ marginTop: 0 }}>Автоплатёж — отмена</h3>
        <p style={{ marginTop: -6, opacity: .85 }}>
          Введите <b>Telegram ID</b> пользователя (или ключ вида <code>vk:12345</code>) и отключите автопродление.
        </p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            placeholder="например: 123456789 или vk:12345"
            value={cancelKey}
            onChange={e => setCancelKey(e.target.value)}
            style={{ flex: '1 1 280px', height: 38, borderRadius: 10, border: '1px solid #2b3552', background: '#121722', padding: '0 10px' }}
          />
          <button
            type="button"
            className="list-btn"
            disabled={!cancelKey.trim() || cancelBusy}
            onClick={() => { haptic('light'); cancelAutopay(); }}
            style={{ padding: '10px 14px', borderRadius: 12 }}
          >
            Отключить автоплатёж
          </button>
        </div>

        {cancelMsg && <div style={{ color: '#7dff9b' }}>{cancelMsg}</div>}
        {cancelErr && <div style={{ color: '#ff5c7a' }}>Ошибка: {cancelErr}</div>}
        <small style={{ opacity: .8 }}>
          Требуется админ-доступ (валидный Telegram WebApp initData).
        </small>
      </section>

      {/* Подсказка про крон */}
      <div style={{ padding: 12, border: '1px dashed #333', borderRadius: 12, opacity: .85 }}>
        Для автосписания раз в сутки вызови <code>/api/cron/autopay</code> из внешнего планировщика
        (headers: <code>x-cron-secret: {'<CRON_SECRET>'}</code>).
      </div>
    </main>
  );
}
