import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: unknown }

    await fetch(`${PLATFORM_API}/platform/auth/request-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ email: body.email }),
    })
  } catch {
    // Intentionally swallowed — always return 200 (enumeration defense per ADR 0002)
  }

  return NextResponse.json({ ok: true })
}
