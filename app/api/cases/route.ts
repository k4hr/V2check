// app/api/cases/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN || '';
const ALLOW_BROWSER_DEBUG = (process.env.ALLOW_BROWSER_DEBUG || '').trim() === '1';

function hmacIsValid(initData: string, botToken: string) {
  try {
    if (!initData || !botToken) return { valid: false, reason: 'empty' };
    const url = new URLSearchParams(initData);
    const hash = url.get('hash') || '';
    url.delete('hash');

    const data = [...url.entries()]
      .map(([k, v]) => `${k}=${v}`)
      .sort()
      .join('\n');

    const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const check = crypto.createHmac('sha256', secret).update(data).digest('hex');

    return { valid: check === hash, hash, check };
  } catch (e: any) {
    return { valid: false, reason: e?.message || 'hmac error' };
  }
}

function extractUserIdFromInitData(initData: string): string | null {
  try {
    const p = new URLSearchParams(initData);
    const unsafe = JSON.parse(p.get('user') || 'null');
    const id = unsafe?.id ? String(unsafe.id) : null;
    return id;
  } catch { return null; }
}

async function requireUser(req: NextRequest) {
  const initData = req.headers.get('x-init-data') || '';
  let userTgId: string | null = null;

  if (initData) {
    const h = hmacIsValid(initData, BOT_TOKEN);
    if (!h.valid) {
      return NextResponse.json({ ok:false, error:'BAD_INITDATA', why: h.reason || 'invalid_hmac' }, { status: 401 });
    }
    userTgId = extractUserIdFromInitData(initData);
  }
  if (!userTgId && ALLOW_BROWSER_DEBUG) {
    const debugId = new URL(req.url).searchParams.get('id');
    if (debugId && /^\d{3,15}$/.test(debugId)) userTgId = debugId;
  }
  if (!userTgId) {
    return NextResponse.json({ ok:false, error:'AUTH_REQUIRED' }, { status: 401 });
  }

  // Находим/создаём пользователя
  let user = await prisma.user.findFirst({ where: { telegramId: String(userTgId) } });
  if (!user) {
    user = await prisma.user.create({
      data: { telegramId: String(userTgId) },
    });
  }
  return user;
}

// GET /api/cases — список дел пользователя (последние 50)
export async function GET(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if ('ok' in (userOrResp as any) && (userOrResp as any).ok === false) {
    return userOrResp as NextResponse;
  }
  const user = userOrResp as any;

  const cases = await prisma.case.findMany({
    where: { userId: user.id },
    orderBy: [{ updatedAt: 'desc' }],
    take: 50,
    include: { items: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ ok:true, cases });
}

// POST /api/cases — создать дело + первый документ/заметка
// body: { title?: string, context?: { root?: string, sub?: string, qaPairs?: string }, aiAnswer: string }
export async function POST(req: NextRequest) {
  const userOrResp = await requireUser(req);
  if ('ok' in (userOrResp as any) && (userOrResp as any).ok === false) {
    return userOrResp as NextResponse;
  }
  const user = userOrResp as any;

  try {
    const body = await req.json();
    const aiAnswer = String(body?.aiAnswer || '').trim();
    let title = String(body?.title || '').trim();
    const context = body?.context || {};

    if (!aiAnswer) {
      return NextResponse.json({ ok:false, error:'AI_ANSWER_REQUIRED' }, { status: 400 });
    }
    if (!title) {
      const root = context?.root ? `Тема: ${context.root}` : 'Дело';
      const sub  = context?.sub  ? ` / ${context.sub}` : '';
      title = `${root}${sub}`;
    }

    const created = await prisma.case.create({
      data: {
        userId: user.id,
        title,
        status: 'active',
        items: {
          create: [
            ...(context?.qaPairs ? [{
              kind: 'note',
              title: 'Контекст (вопросы/ответы)',
              body: context.qaPairs as string,
            }] : []),
            {
              kind: 'doc',
              title: 'Разбор от ассистента',
              body: aiAnswer,
            },
          ],
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ ok:true, id: created.id });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
