import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // sharp требует nodejs runtime

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }
    if (!file.type || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Можно загружать только изображения' }, { status: 415 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const compressed = await sharp(buf).jpeg({ quality: 80 }).toBuffer();
    const base64 = compressed.toString('base64');
    const mime = 'image/jpeg';
    const dataUrl = `data:${mime};base64,${base64}`;

    return NextResponse.json({
      success: true,
      name: file.name,
      size: compressed.length,
      type: mime,
      url: dataUrl,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Ошибка при загрузке изображения' }, { status: 500 });
  }
}
