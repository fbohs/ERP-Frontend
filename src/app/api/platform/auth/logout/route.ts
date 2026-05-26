import 'server-only'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PLATFORM_API = process.env.PLATFORM_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
const COOKIE_NAME = 'platform-auth-token'

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value

  if (token) {
    await fetch(`${PLATFORM_API}/platform/auth/logout`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Idempotency-Key': crypto.randomUUID(),
      },
    }).catch(() => {
      // Best-effort — local cookie is cleared regardless
    })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.delete(COOKIE_NAME)
  return response
}
