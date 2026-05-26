import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'platform-auth-token'
const COOKIE_MAX_AGE = 60 * 60 * 15 // 15 minutes — matches backend token TTL

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { token?: unknown }

  let res: Response
  try {
    res = await fetch(`${BACKEND}/platform/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': crypto.randomUUID(),
      },
      body: JSON.stringify({ token: body.token }),
    })
  } catch {
    return NextResponse.json({ message: 'Verification failed. Please try again.' }, { status: 503 })
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null) as { message?: string } | null
    const message = body?.message ?? 'Invalid or expired sign-in link.'
    return NextResponse.json({ message }, { status: res.status })
  }

  const data = (await res.json()) as { token: string }

  // Fetch admin details with the fresh token so the client can populate Zustand immediately
  let admin: unknown = null
  try {
    const meRes = await fetch(`${BACKEND}/platform/auth/me`, {
      headers: { Authorization: `Bearer ${data.token}` },
    })
    if (meRes.ok) admin = await meRes.json()
  } catch {
    // Non-fatal — client falls back to validateSession() on next mount
  }

  const response = NextResponse.json({ ok: true, admin })
  response.cookies.set(COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}
