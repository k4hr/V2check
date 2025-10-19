/* path: app/api/upload-image/route.ts */
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const runtime = 'nodejs'; // sharp + aws-sdk требуют nodejs runtime

// === ENV (заполни в .env) ======================================
// Идентификатор аккаунта R2 (без домена)
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';              // напр. 376b41c944d618564e7b3570cb03f142
// Имя бакета
const R2_BUCKET     = process.env.R2_BUCKET || '';
// Доступы (Account/User API Token → S3 keys)
const R2_ACCESS_KEY = process.env.R2_ACCESS_KEY || '';
const R2_SECRET_KEY = process.env.R2_SECRET_KEY || '';
// Хост, по которому будут доступны файлы (если оставишь пустым — верну прямой cloudflarestorage URL)
const R2_PUBLIC_HOST = process.env.R2_PUBLIC_HOST || '';            // напр. cdn.example.com или <account>.r2.cloudflarestorage.com
// ===============================================================

function err(message: string, status = 400) {
  return NextResponse.json({ success: false, error: message }, { status });
}

if (!R2_ACCOUNT_ID || !R2_BUCKET || !R2_ACCESS_KEY || !R2_SECRET_KEY) {
  console.error('[R2] Missing env vars: R2_ACCOUNT_ID / R2_BUCKET / R2_ACCESS_KEY / R2_SECRET_KEY');
}

// S3-клиент для Cloudflare R2
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY, secretAccessKey: R2_SECRET_KEY },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return err('Файл не найден', 400);
    if (!file.type || !file.type.startsWith('image/')) return err('Можно загружать только изображения', 415);

    // Сжимаем до JPEG 80
    const srcBuf = Buffer.from(await file.arrayBuffer());
    const jpegBuf = await sharp(srcBuf).jpeg({ quality: 80 }).toBuffer();
    const contentType = 'image/jpeg';

    // Ключ вида YYYY/MM/DD/uuid.jpg
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = String(now.getUTCMonth() + 1).padStart(2, '0');
    const d = String(now.getUTCDate()).padStart(2, '0');
    const key = `${y}/${m}/${d}/${crypto.randomUUID()}.jpg`;

    // Грузим прямо с сервера в R2 (авторизованный PutObject)
    const put = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: jpegBuf,            // Buffer/Uint8Array — ок для aws-sdk v3
      ContentType: contentType,
    });

    await s3.send(put);

    // Публичный URL
    const base =
      R2_PUBLIC_HOST
        ? (R2_PUBLIC_HOST.startsWith('http') ? R2_PUBLIC_HOST : `https://${R2_PUBLIC_HOST}`)
        : `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const publicUrl = `${base.replace(/\/+$/,'')}/${R2_BUCKET}/${key}`;

    return NextResponse.json({
      success: true,
      name: file.name,
      size: jpegBuf.length,
      type: contentType,
      url: publicUrl,
      key,
    });
  } catch (e: any) {
    console.error('[Upload error]', e?.stack || e?.message || e);
    return NextResponse.json({ success: false, error: 'Ошибка при загрузке изображения' }, { status: 500 });
  }
}
