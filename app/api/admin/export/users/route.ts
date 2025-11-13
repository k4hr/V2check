import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BOT_TOKEN =
  process.env.BOT_TOKEN ||
  process.env.TG_BOT_TOKEN ||
  '';

function parseAdminId(init: string | null) {
  try {
    if (!init) return null;
    const sp = new URLSearchParams(init);
    const u = sp.get('user');
    if (!u) return null;
    const j = JSON.parse(u);
    return j?.id ? String(j.id) : null;
  } catch { return null; }
}
function isAdmin(tgId: string | null) {
  const list = (process.env.ADMIN_TG_IDS || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  return !!(tgId && list.includes(tgId));
}

// Отправка TXT-файла администратору в Telegram
async function sendTxtToTelegram(chatId: string, body: string) {
  if (!BOT_TOKEN) throw new Error('BOT_TOKEN_MISSING');

  const form = new FormData();
  form.append('chat_id', chatId);

  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  form.append('document', blob, 'users-started.txt');

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`, {
    method: 'POST',
    body: form,
  });

  const json: any = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    console.error('TG sendDocument failed:', res.status, json);
    throw new Error('TG_SEND_FAILED');
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get('format') || 'txt').toLowerCase();
    const mode = (url.searchParams.get('mode') || 'download').toLowerCase(); // download | send
    const init = req.headers.get('x-init-data') || url.searchParams.get('init') || null;

    const adminId = parseAdminId(init);
    if (!isAdmin(adminId)) {
      return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:401 });
    }

    // Только те, у кого есть хотя бы один StartEvent (нажимали /start)
    const users = await prisma.user.findMany({
      where: { startEvents: { some: {} } },
      select: { telegramId: true },
      orderBy: { telegramId: 'asc' },
      take: 500_000,
    });

    // Старый режим JSON, если кто-то дергает руками
    if (format === 'json' && mode !== 'send') {
      return NextResponse.json({ ok:true, count: users.length, users });
    }

    const body = users.map(u => u.telegramId).join('\n') + (users.length ? '\n' : '');

    // Новый режим: отправить TXT прямо в Telegram админу
    if (mode === 'send') {
      if (!adminId) {
        return NextResponse.json({ ok:false, error:'NO_ADMIN_ID' }, { status:400 });
      }
      await sendTxtToTelegram(adminId, body);
      return NextResponse.json({ ok:true, sent:true, count: users.length });
    }

    // Режим по умолчанию — скачать как HTTP-ответ (например, из обычного браузера)
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users-started.txt"',
      },
    });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message || e) }, { status:500 });
  }
}
