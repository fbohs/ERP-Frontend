import 'server-only'
import { NextRequest, NextResponse } from 'next/server'

const BACKEND = process.env.BACKEND_URL ?? ''
const COOKIE_NAME = 'auth-token'
const ROLE_COOKIE_NAME = 'auth-role'
const COOKIE_MAX_AGE = 8 * 60 * 60 // 8 hours

export async function POST(req: NextRequest) {
  const body = await req.json()

  const res = await fetch(`${BACKEND}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json() as Record<string, unknown>

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }

  // requiresPasswordChange — return setupToken to client, no session cookie yet.
  if (data.requiresPasswordChange === true) {
    return NextResponse.json({ requiresPasswordChange: true, setupToken: data.setupToken })
  }

  // Successful login — set httpOnly cookie, strip token from client response.
  const { token, ...clientData } = data as { token: string } & Record<string, unknown>
  const role = (clientData as { user?: { role?: string } }).user?.role

  const response = NextResponse.json({ ...clientData, requiresPasswordChange: false })
  const cookieOpts = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  }
  response.cookies.set(COOKIE_NAME, token, { ...cookieOpts, httpOnly: true })
  if (role) response.cookies.set(ROLE_COOKIE_NAME, role, cookieOpts)

  return response
}
