/* path: app/api/upload-image/route.ts */
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sharp from 'sharp';

export const runtime = 'nodejs'; // sharp требует nodejs runtime

// === ENV ===
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET = process.env.R2_BUCKET_NAME!;
const PUBLIC_BASE = process.env.R2_PUBLIC_URL!; // https://<account>.r2.cloudflarestorage.com/<bucket>

// Простейший генератор ключа вида images/2025/10/19/<rand>.jpg
function makeObjectKey(ext = 'jpg') {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const rand = crypto.randomBytes(8).toString('hex');
  return `uploads/${yyyy}/${mm}/${dd}/${rand}.${ext}`;
}

// Подпись AWS Signature V4 для R2 (S3-совместимая)
function signPutRequest(path: string, payloadSha256Hex: string, now = new Date()) {
  const region = 'auto';
  const service = 's3';
  const host = `${ACCOUNT_ID}.r2.cloudflarestorage.com`;

  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // YYYYMMDDTHHMMSSZ
  const dateStamp = amzDate.slice(0, 8);                            // YYYYMMDD
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

  const canonicalRequest = [
    'PUT',
    path,                 // /<bucket>/<key>
    '',                   // no query
    `host:${host}`,
    `x-amz-content-sha256:${payloadSha256Hex}`,
    `x-amz-date:${amzDate}`,
    '',
    signedHeaders,
    payloadSha256Hex,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    crypto.createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');

  const kDate = crypto.createHmac('sha256', 'AWS4' + SECRET_ACCESS_KEY).update(dateStamp).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update(region).digest();
  const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
  const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization =
    `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const url = `https://${host}${path}`;
  return { url, amzDate, authorization };
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Можно загружать только изображения' }, { status: 415 });
    }

    // --- компрессия через sharp -> JPEG 80 ---
    const srcBuf = Buffer.from(await file.arrayBuffer());
    const jpegBuf = await sharp(srcBuf).jpeg({ quality: 80 }).toBuffer();
    const contentType = 'image/jpeg';

    // --- ключ и адреса ---
    const key = makeObjectKey('jpg');
    const objectPath = `/${encodeURIComponent(BUCKET)}/${key}`; // путь для подписи/PUT
    const publicUrl = `${PUBLIC_BASE}/${key}`;                  // то, что вернём клиенту

    // --- подпись и загрузка в R2 ---
    const payloadSha256Hex = crypto.createHash('sha256').update(jpegBuf).digest('hex');
    const { url, amzDate, authorization } = signPutRequest(objectPath, payloadSha256Hex);

    const putRes = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': authorization,
        'x-amz-content-sha256': payloadSha256Hex,
        'x-amz-date': amzDate,
        // Content-Type можно не подписывать — но отправляем, чтобы корректно открывалось
        'Content-Type': contentType,
      },
      body: jpegBuf,
    });

    if (!putRes.ok) {
      let detail = '';
      try { detail = await putRes.text(); } catch {}
      console.error('[R2_PUT_ERROR]', putRes.status, detail);
      return NextResponse.json({ error: 'Не удалось загрузить в R2', status: putRes.status, detail }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      name: file.name,
      size: jpegBuf.length,
      type: contentType,
      url: publicUrl,       // этот URL вставляй в чат
      key,                  // полезно, если нужно будет удалить
      bucket: BUCKET,
    });
  } catch (err) {
    console.error('[UPLOAD_IMAGE_ERROR]', err);
    return NextResponse.json({ error: 'Ошибка при загрузке изображения' }, { status: 500 });
  }
}
