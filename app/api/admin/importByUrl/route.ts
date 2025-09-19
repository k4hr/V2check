// app/api/admin/importByUrl/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ADMIN_SECRET =
  (process.env.ADMIN_SECRET || process.env.ADMIN_TOKEN || '').trim();

// ---------- helpers ----------
function requireAdminSecret(got?: string) {
  if (!ADMIN_SECRET) throw new Error('ADMIN_SECRET_NOT_SET');
  if ((got || '').trim() !== ADMIN_SECRET) throw new Error('FORBIDDEN');
}

function slugify(s: string) {
  return String(s || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_/]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function extractHtml(url: string, selector?: string) {
  // ленивые импорты — только на сервере
  const { JSDOM } = await import('jsdom');
  const sanitizeHtml = (await import('sanitize-html')).default;
  const { Readability } = await import('@mozilla/readability');

  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`FETCH_FAILED_${res.status}`);
  const html = await res.text();

  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  let contentEl: Element | null = null;

  if (selector) {
    contentEl = doc.querySelector(selector);
  }
  if (!contentEl) {
    // пробуем Readability как fallback
    const reader = new Readability(doc);
    const article = reader.parse();
    if (article?.content) {
      const dom2 = new JSDOM(article.content);
      contentEl = dom2.window.document.body;
    }
  }
  if (!contentEl) {
    // как крайний вариант — вся страница
    contentEl = doc.body;
  }

  const clean = sanitizeHtml(contentEl.innerHTML, {
    allowedTags: false, // разрешаем по-умолчанию базовые
    allowedAttributes: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener' }),
    },
  });

  return clean;
}

type UpsertInput = {
  url: string;
  category?: string | null;
  slug?: string | null;
  title?: string | null;
  updatedAt?: string | null;
  selector?: string | null;
};

// единая логика апсерта
async function upsertDoc(payload: UpsertInput) {
  const { url, category, slug, title, updatedAt, selector } = payload;
  if (!url) throw new Error('URL_REQUIRED');

  // вытаскиваем контент
  const contentHtml = await extractHtml(url, selector || undefined);

  // определение полей по-умолчанию
  const _title = title || new URL(url).hostname;
  const _slug = slug ? slugify(slug) : slugify(_title);
  const _category =
    (category && category.trim()) ||
    (url.includes('constitution') ? 'constitution' :
     url.includes('pdd') ? 'pdd' :
     url.includes('kodeks') || url.includes('code') ? 'codes' :
     url.includes('ustav') ? 'ustavy' :
     'federal');

  const upd = updatedAt ? new Date(updatedAt) : new Date();

  // сохраняем Doc + DocVersion
  const doc = await prisma.doc.upsert({
    where: { slug: _slug },
    create: {
      slug: _slug,
      title: _title,
      category: _category,
      sourceUrl: url,
      updatedAt: upd,
      versions: {
        create: { contentHtml },
      },
    },
    update: {
      title: _title,
      category: _category,
      sourceUrl: url,
      updatedAt: upd,
      // при каждом импорте — новая версия
      versions: { create: { contentHtml } },
    },
    include: { versions: { orderBy: { createdAt: 'desc' }, take: 1 } },
  });

  return { ok: true as const, doc: { id: doc.id, slug: doc.slug, title: doc.title, category: doc.category } };
}

// ---------- GET (удобно с телефона через URL) ----------
export async function GET(req: NextRequest) {
  try {
    const urlObj = new URL(req.url);
    const p = urlObj.searchParams;

    requireAdminSecret(p.get('secret') || p.get('token') || '');

    const payload: UpsertInput = {
      url: p.get('url') || '',
      category: p.get('category'),
      slug: p.get('slug'),
      title: p.get('title'),
      updatedAt: p.get('updatedAt'),
      selector: p.get('selector'),
    };

    const result = await upsertDoc(payload);
    return NextResponse.json(result);
  } catch (e: any) {
    const msg = e?.message || 'SERVER_ERROR';
    const status = msg === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

// ---------- POST (осталась старая форма JSON) ----------
export async function POST(req: NextRequest) {
  try {
    const secret =
      req.headers.get('x-admin-secret') ||
      req.headers.get('x-token') ||
      (new URL(req.url)).searchParams.get('secret') ||
      '';
    requireAdminSecret(secret);

    const body = (await req.json().catch(() => ({}))) as UpsertInput;
    if (!body?.url) throw new Error('URL_REQUIRED');

    const result = await upsertDoc(body);
    return NextResponse.json(result);
  } catch (e: any) {
    const msg = e?.message || 'SERVER_ERROR';
    const status = msg === 'FORBIDDEN' ? 403 : 400;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
