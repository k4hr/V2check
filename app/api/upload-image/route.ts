import { NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs'; // нужно для sharp на Railway

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Файл не найден' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Можно загружать только изображения' }, { status: 415 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Сжимаем JPEG до 80% качества
    const compressed = await sharp(buffer)
      .jpeg({ quality: 80 })
      .toBuffer();

    // Кодируем в base64 (временно вместо CDN)
    const base64 = compressed.toString('base64');
    const mime = file.type || 'image/jpeg';
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
