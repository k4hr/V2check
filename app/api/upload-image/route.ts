/* path: app/api/upload-image/route.ts */
import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // sharp требует nodejs runtime

// --- ENV (заполни в .env) ---
const R2_PUBLIC_HOST = process.env.R2_PUBLIC_HOST || ''; // пример: 376b41c....r2.cloudflarestorage.com
const R2_BUCKET = process.env.R2_BUCKET || '';           // имя бакета

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
    if (!file.type || !file.type.startsWith('image/')) return errJson('Можно загружать только изображения', 415);

    // Сжимаем до JPEG (80)
    const srcBuf = Buffer.from(await file.arrayBuffer());
    const jpegBuf = await sharp(srcBuf).jpeg({ quality: 80 }).toBuffer();
    const contentType = 'image/jpeg';

    // Ключ в бакете: YYYY/MM/DD/uuid.jpg
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const key = `${y}/${m}/${d}/${crypto.randomUUID()}.jpg`;

    // Публичный URL (именно его вернем фронту)
    const publicUrl = `https://${R2_PUBLIC_HOST}/${R2_BUCKET}/${key}`;

    // Загружаем напрямую (анонимный PUT должен быть разрешен; иначе нужен presigned URL / S3 SDK)
    const putUrl = publicUrl;

    // ✅ ВАЖНО: конвертируем Buffer -> ArrayBuffer
    const ab: ArrayBuffer = jpegBuf.buffer.slice(
      jpegBuf.byteOffset,
      jpegBuf.byteOffset + jpegBuf.byteLength
    );

    const putRes = await fetch(putUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': contentType,
        // Если требуется подпись (обычно так и есть) — тут должна быть AWS SigV4 авторизация,
        // или используй presigned URL/SDK.
      },
      body: ab,
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
      url: publicUrl,
    });
  } catch (err: any) {
    console.error('Upload error:', err?.stack || err?.message || err);
    return NextResponse.json({ success: false, error: 'Ошибка при загрузке изображения' }, { status: 500 });
  }
}
