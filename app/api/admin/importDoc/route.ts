// app/api/admin/importDoc/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_SECRET = (process.env.ADMIN_SECRET || '').trim();

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_SECRET) {
      return NextResponse.json({ ok:false, error:'ADMIN_SECRET_MISSING' }, { status:500 });
    }
    const sec = (req.headers.get('x-admin-secret') || '').trim();
    if (sec !== ADMIN_SECRET) {
      return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });
    }

    const body = await req.json().catch(() => ({}));
    const { slug, title, category, updatedAt, sourceUrl, contentHtml } = body || {};

    if (!slug || !title || !category || !contentHtml) {
      return NextResponse.json({ ok:false, error:'BAD_INPUT' }, { status:400 });
    }

    const doc = await prisma.doc.upsert({
      where: { slug },
      create: {
        slug, title, category,
        sourceUrl: sourceUrl || null,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date()
      },
      update: {
        title, category,
        sourceUrl: sourceUrl || null,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date()
      }
    });

    await prisma.docVersion.create({
      data: {
        docId: doc.id,
        contentHtml: String(contentHtml),
      }
    });

    return NextResponse.json({ ok:true, id: doc.id });
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}
