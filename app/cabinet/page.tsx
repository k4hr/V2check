"use client";

import { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";

interface UserData {
  username?: string;
  firstName?: string;
  plan?: string | null;
  expiresAt?: string | null;
}

export default function CabinetPage() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    WebApp.ready();
    const initData = WebApp.initDataUnsafe;

    if (initData?.user) {
      fetch("/api/me")
        .then((res) => res.json())
        .then((data) => {
          setUser({
            username: initData.user.username,
            firstName: initData.user.first_name,
            plan: data.plan,
            expiresAt: data.expiresAt,
          });
        })
        .catch(() => {
          setUser({
            username: initData.user.username,
            firstName: initData.user.first_name,
          });
        });
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen text-white p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Личный кабинет</h1>

      {user ? (
        <>
          <p className="text-lg mb-6">
            Здравствуйте, {user.firstName || user.username}
          </p>

          {user.plan ? (
            <div className="text-center bg-gray-800 p-4 rounded-lg">
              <p className="text-lg font-semibold">У вас оформлен Juristum Pro</p>
              <p className="text-sm text-gray-300">
                Подписка действует до: {user.expiresAt}
              </p>
            </div>
          ) : (
            <button
              onClick={() => (window.location.href = "/subscribe")}
              className="px-4 py-2 bg-blue-600 rounded-lg mt-4"
            >
              Оформить подписку
            </button>
          )}
        </>
      ) : (
        <p className="text-lg text-gray-400">Не удалось получить данные из Telegram</p>
      )}
    </div>
  );
}
