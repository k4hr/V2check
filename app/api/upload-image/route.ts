/* path: app/api/upload-image/route.ts */
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // sharp требует nodejs runtime

// --- ENV (подставь свои значения в .env) ---
// Хост R2 вида: 376b41c944d618564e7b3570cb03f142.r2.cloudflarestorage.com
const R2_PUBLIC_HOST = process.env.R2_PUBLIC_HOST || '';
const R2_BUCKET = process.env.R2_BUCKET || '';

function errJson(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

export async function POST(req: Request) {
  try {
    if (!R2_PUBLIC_HOST || !R2_BUCKET) {
      return errJson('R2 misconfigured: set R2_PUBLIC_HOST and R2_BUCKET on the server', 500);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return errJson('Файл не найден', 400);
    if (!file.type || !file.type.startsWith('image/')) {
      return errJson('Можно загружать только изображения', 415);
    }

    // Сжимаем до JPEG (80)
    const srcBuf = Buffer.from(await file.arrayBuffer());
    const jpegBuf = await sharp(srcBuf).jpeg({ quality: 80 }).toBuffer();

    // Ключ в бакете
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const key = `${y}/${m}/${d}/${crypto.randomUUID()}.jpg`;

    const contentType = 'image/jpeg';

    // ПУБЛИЧНЫЙ URL (для отдачи)
    const publicUrl = `https://${R2_PUBLIC_HOST}/${R2_BUCKET}/${key}`;

    // Прямая загрузка через HTTPS на R2 (если в аккаунте разрешён анонимный PUT; иначе нужен S3-подпись)
    const putUrl = publicUrl;

    // ✅ фикc типизации: передаём Blob, а не Buffer
    const bodyBlob = new Blob([jpegBuf], { type: contentType });

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        // Если используешь подписанный доступ — тут должны быть заголовки авторизации (AWS SigV4).
      },
      body: bodyBlob,
    });

    if (!putRes.ok) {
      const txt = await putRes.text().catch(() => '');
      console.error('[R2_PUT_FAILED]', putRes.status, txt);
      return errJson(`R2 PUT failed: ${putRes.status}`, 502);
    }

    return NextResponse.json({
      success: true,
      name: file.name,
      size: jpegBuf.length,
      type: contentType,
      url: publicUrl, // отдаём https-URL, который потом прилетит в /api/assistant/ask
    });
  } catch (err: any) {
    console.error('Upload error:', err?.stack || err?.message || err);
    return NextResponse.json({ success: false, error: 'Ошибка при загрузке изображения' }, { status: 500 });
  }
}
