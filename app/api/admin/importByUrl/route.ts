// @ts-nocheck
// app/api/admin/importByUrl/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_SECRET = (process.env.ADMIN_SECRET || '').trim();

// Белый список доменов-источников
const ALLOW = new Set<string>([
  'pravo.gov.ru',
  'publication.pravo.gov.ru',
  'kremlin.ru',
  'www.consultant.ru',
  'base.garant.ru',
  'rg.ru',
]);

async function extractHtml(url: string, selector?: string) {
  // ЛЕНИВЫЕ импорты — пакеты нужны только на сервере
  const { JSDOM } = await import('jsdom');
  const sanitizeHtml = (await import('sanitize-html')).default;
  const { Readability } = await import('@mozilla/readability');

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`fetch failed ${res.status}`);
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  let raw: string;
  if (selector) {
    const el = doc.querySelector(selector);
    if (!el) throw new Error(`selector not found: ${selector}`);
    raw = el.innerHTML;
  } else {
    const reader = new Readability(doc);
    const art = reader.parse();
    raw = art?.content || doc.body.innerHTML;
  }

  const clean = sanitizeHtml(raw, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'h1','h2','h3','table','thead','tbody','tr','td','th','sup','sub'
    ]),
    allowedAttributes: { '*': ['id','class','href','name','colspan','rowspan'] },
    allowedSchemes: ['http','https','mailto'],
  });

  const title = (doc.querySelector('h1')?.textContent || doc.title || '').trim() || 'Без названия';

  return { contentHtml: clean, detectedTitle: title };
}

export async function POST(req: NextRequest) {
  try {
    if (!ADMIN_SECRET) return NextResponse.json({ ok:false, error:'ADMIN_SECRET_MISSING' }, { status:500 });
    const sec = (req.headers.get('x-admin-secret') || '').trim();
    if (sec !== ADMIN_SECRET) return NextResponse.json({ ok:false, error:'FORBIDDEN' }, { status:403 });

    const body = await req.json().catch(() => ({} as any));
    const url: string = String(body.url || '');
    const slug: string | undefined = body.slug || undefined;
    const category: string = String(body.category || '').toLowerCase(); // constitution|codes|ustavy|pdd|federal
    const selector: string | undefined = body.selector || undefined;
    const titleOverride: string | undefined = body.title || undefined;
    const updatedAt: string | undefined = body.updatedAt || undefined;

    if (!url || !category) return NextResponse.json({ ok:false, error:'url_and_category_required' }, { status:400 });

    try {
      const u = new URL(url);
      if (ALLOW.size && !ALLOW.has(u.hostname)) {
        return NextResponse.json({ ok:false, error:`domain_not_allowed: ${u.hostname}` }, { status:400 });
      }
    } catch {
      return NextResponse.json({ ok:false, error:'bad_url' }, { status:400 });
    }

    const { contentHtml, detectedTitle } = await extractHtml(url, selector);
    const title = (titleOverride || detectedTitle).trim();
    const safeSlug =
      (slug ||
        (title
          .toLowerCase()
          .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
          .replace(/^-+|-+$/g, '')
          .slice(0, 80))) || `doc-${Date.now()}`;

    const doc = await prisma.doc.upsert({
      where: { slug: safeSlug },
      create: {
        slug: safeSlug,
        title,
        category,
        sourceUrl: url,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
      update: {
        title,
        category,
        sourceUrl: url,
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
      },
    });

    const ver = await prisma.docVersion.create({
      data: { docId: doc.id, contentHtml },
    });

    return NextResponse.json({ ok:true, docId: doc.id, slug: doc.slug, versionId: ver.id });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error: e?.message || 'SERVER_ERROR' }, { status:500 });
  }
}
