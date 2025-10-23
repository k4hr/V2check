import { NextResponse } from 'next/server';
import crypto from 'crypto';

function md5(s: string) {
  return crypto.createHash('md5').update(s, 'utf8').digest('hex').toUpperCase();
}

export async function POST(req: Request) {
  const data = await req.formData();
  const OutSum = String(data.get('OutSum') ?? '');
  const InvId = String(data.get('InvId') ?? '');
  const SignatureValue = String(data.get('SignatureValue') ?? '').toUpperCase();

  const mySign = md5(`${OutSum}:${InvId}:${process.env.ROBOKASSA_PASSWORD2}`);

  if (mySign !== SignatureValue) {
    return new NextResponse('bad sign', { status: 400 });
  }

  // TODO: отметить оплату InvId как успешную

  return new NextResponse(`OK${InvId}`, { status: 200 });
}
