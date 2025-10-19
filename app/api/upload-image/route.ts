/* path: app/api/upload-image/route.ts */
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs'; // sharp + aws-sdk требуют nodejs runtime

// ===== ENV (оба варианта имён + trim) =========================
const R2_ACCOUNT_ID       = (process.env.R2_ACCOUNT_ID || '').trim();            // 376b41c9...
const R2_BUCKET_NAME      = (
  process.env.R2_BUCKET_NAME ||
  process.env.R2_BUCKET ||
  ''
).trim();
const R2_ACCESS_KEY_ID    = (
  process.env.R2_ACCESS_KEY_ID ||
  process.env.R2_ACCESS_KEY ||
  ''
).trim();
const R2_SECRET_ACCESS_KEY = (
  process.env.R2_SECRET_ACCESS_KEY ||
  process.env.R2_SECRET_KEY ||
  ''
).trim();
// База для публичных ссылок: https://pub-....r2.dev или свой домен/хост
const R2_PUBLIC_BASE = (
  process.env.R2_PUBLIC_URL ||
  process.env.R2_PUBLIC_HOST ||
  ''
).trim();
// ===============================================================

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

// S3-клиент для Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function POST(req: Request) {
  try {
    // базовая проверка окружения с безопасными логами
    if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
      console.error('[R2_ENV_MISSING]', {
        accountId: !!R2_ACCOUNT_ID,
        accessKey: !!R2_ACCESS_KEY_ID,
        secretKey: !!R2_SECRET_ACCESS_KEY,
      });
      return err('R2 credentials are not configured', 500);
    }
    if (!R2_BUCKET_NAME) {
      console.error('[R2_BUCKET_MISSING]');
      return err('R2 bucket name is not configured', 500);
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) return err('Файл не найден', 400);
    if (!file.type || !file.type.startsWith('image/')) {
      return err('Можно загружать только изображения', 415);
    }

    // Сжимаем до JPEG (80)
    const srcBuf = Buffer.from(await file.arrayBuffer());
    const jpegBuf = await sharp(srcBuf).jpeg({ quality: 80 }).toBuffer();
    const contentType = 'image/jpeg';

    // Ключ вида YYYY/MM/DD/uuid.jpg
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const key = `${y}/${m}/${d}/${crypto.randomUUID()}.jpg`;

    // Загрузка в R2 через PutObject
    await s3.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: jpegBuf,                 // Buffer/Uint8Array — ок
      ContentType: contentType,
    }));

    // Публичный URL
    const base = R2_PUBLIC_BASE
      ? (R2_PUBLIC_BASE.startsWith('http') ? R2_PUBLIC_BASE : `https://${R2_PUBLIC_BASE}`)
      : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const publicUrl = `${base.replace(/\/+$/, '')}/${encodeURIComponent(R2_BUCKET_NAME)}/${encodeURI(key)}`;

    return NextResponse.json({
      success: true,
      name: file.name,
      size: jpegBuf.length,
      type: contentType,
      url: publicUrl,
      key,
    });
  } catch (e: any) {
    console.error('[Upload error]', e?.message || e);
    return NextResponse.json(
      { success: false, error: 'Ошибка при загрузке изображения' },
      { status: 500 }
    );
  }
}
