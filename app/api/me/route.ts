import { NextResponse } from 'next/server';
import { verifyInitData } from '../../../../lib/auth/verifyInitData';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const initData = searchParams.get('initData');

  try {
    const user = verifyInitData(initData ?? '');
    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 400 });
  }
}
