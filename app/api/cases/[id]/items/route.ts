// app/api/cases/[id]/items/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getCaseIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean); // ["api","cases","<id>","items"]
    const idx = parts.findIndex((p) => p === 'cases');
    return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : null;
  } catch {
    return null;
  }
}

function safeDate(input: any): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}
function safeStr(input: any, max = 200): string | null {
  if (typeof input !== 'string') return null;
  const s = input.trim();
  return s ? s.slice(0, max) : null;
}

const ALLOWED_KIND = new Set(['note', 'step', 'deadline', 'doc']);

export async function GET(req: Request) {
  try {
    const caseId = getCaseIdFromUrl(req.url);
    if (!caseId) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    const items = await prisma.caseItem.findMany({
      where: { caseId },
      orderBy: [{ dueAt: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const caseId = getCaseIdFromUrl(req.url);
    if (!caseId) return NextResponse.json({ ok: false, error: 'MISSING_ID' }, { status: 400 });

    // убедимся, что дело существует
    const exists = await prisma.case.findUnique({ where: { id: caseId }, select: { id: true } });
    if (!exists) return NextResponse.json({ ok: false, error: 'CASE_NOT_FOUND' }, { status: 404 });

    const body = await req.json().catch(() => ({} as any));
    const kindIn = safeStr(body?.kind, 20) || 'note';
    const kind = ALLOWED_KIND.has(kindIn) ? kindIn : 'note';

    const title = safeStr(body?.title, 200);
    if (!title) return NextResponse.json({ ok: false, error: 'TITLE_REQUIRED' }, { status: 400 });

    const item = await prisma.caseItem.create({
      data: {
        caseId,
        kind,
        title,
        body: typeof body?.body === 'string' ? body.body.trim() : undefined,
        dueAt: body?.dueAt ? safeDate(body.dueAt) : undefined,
        priority: Number.isFinite(body?.priority) ? Number(body.priority) : undefined,
        // done по схеме = false
      },
    });

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'SERVER_ERROR' }, { status: 500 });
  }
}
