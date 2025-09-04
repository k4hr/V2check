import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')

  if (token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false, error: 'UNAUTHORIZED' }, { status: 401 })
  }

  return new Promise((resolve) => {
    exec('npx prisma db push', (error, stdout, stderr) => {
      if (error) {
        resolve(NextResponse.json({ ok: false, error: stderr }))
      } else {
        resolve(NextResponse.json({ ok: true, log: stdout }))
      }
    })
  })
}
