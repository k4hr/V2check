// app/api/cases/auto-create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = (globalThis as any).__prisma__ || new PrismaClient();
if (process.env.NODE_ENV !== 'production') (globalThis as any).__prisma__ = prisma;

// --- helpers -------------------------------------------------------

function getDebugTgId(req: NextRequest): string | null {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id && /^\d{3,15}$/.test(id)) return id;
  } catch {}
  return null;
}

// Берём Telegram id из initData (без криптоподписи, как быстрый вариант, как в /api/me)
function getTgIdFromInitData(req: NextRequest): string | null {
  const initData = req.headers.get('x-init-data') || '';
  if (!initData) return null;
  try {
    const sp = new URLSearchParams(initData);
    const userStr = sp.get('user');
    if (!userStr) return null;
    const u = JSON.parse(userStr);
    if (u?.id) return String(u.id);
  } catch {}
  return null;
}

async function resolveUser(req: NextRequest) {
  const tgId = getTgIdFromInitData(req) || getDebugTgId(req);
  if (!tgId) return null;

  // upsert чтобы не падать, если юзер ещё не создан
  const user = await prisma.user.upsert({
    where: { telegramId: tgId },
    create: { telegramId: tgId },
    update: {},
  });
  return user;
}

// --- route handlers -------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const user = await resolveUser(req);
    if (!user) return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 });

    const json = await req.json().catch(() => ({}));
    const {
      title,
      root,     // string
      sub,      // string
      qa = [],  // массив { q: string, a: string }
      answer = '', // полный текст ответа ИИ
      nextDueAt,    // ISO-строка, опционально
    } = json || {};

    const safeTitle = (typeof title === 'string' && title.trim()) ? title.trim() : 'Моё дело';
    const safeRoot  = typeof root === 'string' ? root : '';
    const safeSub   = typeof sub === 'string' ? sub : '';
    const safeAnswer = typeof answer === 'string' ? answer : '';

    let due: Date | null = null;
    if (nextDueAt) {
      const d = new Date(nextDueAt);
      if (!isNaN(d.getTime())) due = d;
    }

    // защита от дублей: если уже есть дело с таким же title, созданное <= 2 часа назад — вернём его
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const existing = await prisma.case.findFirst({
      where: {
        userId: user.id,
        title: safeTitle,
        createdAt: { gte: twoHoursAgo },
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    let caseId: string;

    if (existing) {
      caseId = existing.id;
    } else {
      const created = await prisma.case.create({
        data: {
          userId: user.id,
          title: safeTitle,
          status: 'active',
          nextDueAt: due ?? undefined,
        },
        select: { id: true },
      });
      caseId = created.id;

      // 1) Сохраняем полный ответ ИИ как заметку
      if (safeAnswer) {
        await prisma.caseItem.create({
          data: {
            caseId,
            kind: 'note',
            title: 'Ответ ассистента',
            body: safeAnswer,
          },
        });
      }

      // 2) Сохраняем уточняющие вопросы/ответы пользователя
      if (Array.isArray(qa) && qa.length) {
        const itemsData = qa
          .filter((x: any) => x && typeof x.q === 'string')
          .map((x: any) => ({
            caseId,
            kind: 'note' as const,
            title: `Уточнение: ${x.q}`.slice(0, 150),
            body: typeof x.a === 'string' ? x.a : '',
          }));
        if (itemsData.length) {
          await prisma.caseItem.createMany({ data: itemsData });
        }
      }
    }

    // пересчитать ближайший дедлайн (если он был передан или появились дедлайны позже)
    const nearest = await prisma.caseItem.findFirst({
      where: { caseId, dueAt: { not: null } },
      orderBy: { dueAt: 'asc' },
      select: { dueAt: true },
    });
    await prisma.case.update({
      where: { id: caseId },
      data: { nextDueAt: nearest?.dueAt ?? (due ?? null) },
    });

    return NextResponse.json({ ok: true, caseId });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'INTERNAL' }, { status: 500 });
  }
}
