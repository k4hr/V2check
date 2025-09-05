import type { NextRequest } from 'next/server'

// Extract Telegram user id either from real initData or from x-telegram-id header (for local/Railway tests)
export async function getTelegramId(req: NextRequest): Promise<string> {
  const test = req.headers.get('x-telegram-id')
  if (test) return test

  const initData = req.headers.get('x-telegram-init-data') ?? ''
  const params = new URLSearchParams(initData)
  const userJson = params.get('user')
  if (!userJson) throw new Error('No Telegram user in initData')
  const user = JSON.parse(userJson) as { id: number }
  return String(user.id)
}
