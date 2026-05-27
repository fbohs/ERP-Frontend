import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'
const COOKIE_MAX_AGE = 8 * 60 * 60 // 8 hours

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${BACKEND}/auth/setup-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json() as Record<string, unknown>

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  // Set httpOnly cookie, strip token from client response.
  const { token, ...clientData } = data as { token: string } & Record<string, unknown>

  const response = NextResponse.json(clientData)
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  })

  return response
}
