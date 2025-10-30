// app/diag/myip/route.ts
import { NextResponse } from 'next/server';
import { dispatcherFor } from '@/lib/proxy';

export async function GET() {
  const url = 'https://api.ipify.org?format=json';
  const res = await fetch(url, {
    // @ts-ignore
    dispatcher: dispatcherFor('https://securepay.tinkoff.ru/v2/Init'),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ viaProxyIp: data.ip });
}
