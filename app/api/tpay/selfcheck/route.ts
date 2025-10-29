// app/api/tpay/selfcheck/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    apiBase: process.env.TINKOFF_API || process.env.TINKOFF_API_URL || null,
    hasTerminalKey: !!process.env.TINKOFF_TERMINAL_KEY,
    hasPassword: !!process.env.TINKOFF_PASSWORD,
    successUrl: process.env.TINKOFF_SUCCESS_URL || null,
    failUrl: process.env.TINKOFF_FAIL_URL || null,
    nodeEnv: process.env.NODE_ENV || null,
  });
}
