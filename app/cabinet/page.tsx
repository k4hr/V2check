"use client";

import React, { useEffect, useMemo, useState } from "react";

type TgUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
};

type MeResponse =
  | {
      ok: true;
      user: {
        id: string;
        telegramId: string;
        username?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        photoUrl?: string | null;
      };
      subscription: {
        active: boolean;
        plan?: string | null;
        expiresAt?: string | null; // ISO
      };
    }
  | { ok: false; error: string };

export default function CabinetPage() {
  const [user, setUser] = useState<TgUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [subActive, setSubActive] = useState<boolean>(false);
  const [subExpiresAt, setSubExpiresAt] = useState<string | null>(null);

  // аккуратно форматируем имя
  const displayName = useMemo(() => {
    if (!user) return "Гость";
    return (
      user.first_name ||
      user.username ||
      (user.last_name ? `${user.last_name}` : "Гость")
    );
  }, [user]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const mod = await import("@twa-dev/sdk");
        const WebApp = (mod.default ?? mod) as any;

        // на всякий случай — мягкие вызовы
        WebApp?.ready?.();
        WebApp?.expand?.();

        const unsafe = WebApp?.initDataUnsafe;
        const initData = WebApp?.initData;

        if (mounted && unsafe?.user) {
          setUser(unsafe.user as TgUser);
        }

        // тянем статус подписки (если есть initData)
        if (initData) {
          const res = await fetch("/api/me", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ initData }),
            cache: "no-store",
          });

          const data: MeResponse = await res.json();

          if (mounted && data?.ok) {
            setSubActive(Boolean(data.subscription?.active));
            setSubExpiresAt(data.subscription?.expiresAt ?? null);
          } else {
            // если API вернул ошибку — считаем неактивной
            if (mounted) {
              setSubActive(false);
              setSubExpiresAt(null);
            }
          }
        } else {
          // нет initData => неактивна (например, открыт не из Telegram)
          if (mounted) {
            setSubActive(false);
            setSubExpiresAt(null);
          }
        }
      } catch (e) {
        // SDK недоступен / ошибка — отрисуем гость+неактивна
        if (mounted) {
          setUser(null);
          setSubActive(false);
          setSubExpiresAt(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "24px 16px 48px",
        textAlign: "center",
      }}
    >
      <h1 style={{ fontWeight: 800, fontSize: 28, lineHeight: "32px" }}>
        Личный кабинет
      </h1>

      <p style={{ fontSize: 18 }}>
        Здравствуйте, <b>{displayName}</b>
      </p>

      {/* Аватар по центру */}
      <div style={{ height: 8 }} />
      {user?.photo_url ? (
        <img
          src={user.photo_url}
          alt="avatar"
          width={112}
          height={112}
          style={{
            width: 112,
            height: 112,
            objectFit: "cover",
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.15)",
          }}
        />
      ) : (
        // заглушка-инициал
        <div
          aria-label="avatar"
          style={{
            width: 112,
            height: 112,
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(85,214,189,1) 0%, rgba(28,164,236,1) 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 44,
          }}
        >
          {(displayName?.[0] || "Г").toUpperCase()}
        </div>
      )}

      {/* Заголовок блока статуса — ВНЕ карточки */}
      <div style={{ height: 18 }} />
      <h2
        style={{
          fontWeight: 700,
          fontSize: 22,
          marginBottom: 4,
        }}
      >
        Статус подписки
      </h2>

      {/* Карточка статуса */}
      <div
        style={{
          width: "100%",
          maxWidth: 680,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14,
          padding: 16,
          textAlign: "center",
        }}
      >
        {loading ? (
          <p>Проверяем статус…</p>
        ) : subActive ? (
          <>
            <p style={{ fontSize: 16, marginBottom: 6 }}>
              Подписка <b>активна</b>.
            </p>
            {subExpiresAt && (
              <p style={{ opacity: 0.85 }}>
                Действительна до{" "}
                {new Date(subExpiresAt).toLocaleDateString("ru-RU", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            )}
          </>
        ) : (
          <>
            <p style={{ fontSize: 16, marginBottom: 12 }}>
              Подписка <b>не активна</b>.
            </p>
            <button
              onClick={() => (window.location.href = "/pricing")}
              style={{
                display: "inline-block",
                background: "#2b6cb0",
                color: "white",
                padding: "10px 16px",
                borderRadius: 10,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
              }}
            >
              Оформить подписку
            </button>
          </>
        )}
      </div>

      {/* Подсказка, если человек открыл не из Telegram */}
      {!user && !loading && (
        <p style={{ opacity: 0.7, maxWidth: 680 }}>
          Похоже, приложение открыто вне Telegram. Откройте через кнопку Web
          App у бота, чтобы увидеть персональные данные.
        </p>
      )}
    </div>
  );
}
