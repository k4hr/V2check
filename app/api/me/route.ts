import { NextRequest, NextResponse } from 'next/server';
import { verifyInitData } from '@/app/lib/auth/verifyInitData';
import { prisma } from '@/app/lib/prisma';

export async function POST(req: NextRequest){
  try{
    const { initData } = await req.json();
    const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TG_BOT_TOKEN;
    const v = verifyInitData(String(initData || ''), String(BOT_TOKEN || ''));
    if (!v.ok || !v.payload?.user) {
      return NextResponse.json({ ok:false, error: v.reason || 'Invalid initData' }, { status: 401 });
    }
    const u = v.payload.user as any;
    const telegramId = String(u.id);
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return NextResponse.json({ ok:false, error:'User not found' }, { status: 404 });
    return NextResponse.json({ ok:true, user });
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'Server error' }, { status: 500 });
  }
}
