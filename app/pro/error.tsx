// app/pro/error.tsx — локальный error boundary для /pro
'use client';

export default function ProError(
  { error, reset }: { error: Error & { digest?: string }; reset: () => void }
) {
  return (
    <main>
      <div className="safe" style={{ maxWidth: 560, margin: '0 auto', padding: 12 }}>
        <div className="card" role="alert" style={{ borderColor: 'rgba(255,0,0,.35)' }}>
          <b>Не удалось открыть раздел оплаты</b>
          <div style={{ opacity: .75, marginTop: 6, fontSize: 13 }}>
            {error?.message || 'Неизвестная ошибка'}
          </div>
          <button type="button" className="list-btn" style={{ marginTop: 12 }} onClick={() => reset()}>
            <span className="list-btn__left"><b>Повторить</b></span>
            <span className="list-btn__right"><span className="list-btn__chev">↻</span></span>
          </button>
        </div>
      </div>
    </main>
  );
}
