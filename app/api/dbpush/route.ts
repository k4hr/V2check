import { NextResponse, type NextRequest } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
const $ = promisify(exec)

export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get('token') ?? ''
  if (token !== process.env.ADMIN_TOKEN)
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 })

  try {
    const { stdout, stderr } = await $(`npx prisma db push --accept-data-loss && npx prisma generate`)
    return NextResponse.json({ ok: true, stdout, stderr })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
